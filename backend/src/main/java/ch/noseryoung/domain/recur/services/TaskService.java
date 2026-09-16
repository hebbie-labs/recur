package ch.noseryoung.domain.recur.services;

import ch.noseryoung.domain.recur.dto.CreateTaskRequest;
import ch.noseryoung.domain.recur.dto.PatchTaskRequest;
import ch.noseryoung.domain.recur.dto.ProjectReference;
import ch.noseryoung.domain.recur.enums.Frequency;
import ch.noseryoung.domain.recur.exceptions.NotGroupMemberException;
import ch.noseryoung.domain.recur.exceptions.ProjectNotFoundException;
import ch.noseryoung.domain.recur.exceptions.TaskNotFoundException;
import ch.noseryoung.domain.recur.models.Project;
import ch.noseryoung.domain.recur.models.Task;
import ch.noseryoung.domain.recur.models.User;
import ch.noseryoung.domain.recur.repositories.ProjectRepository;
import ch.noseryoung.domain.recur.repositories.TaskRepository;
import ch.noseryoung.domain.recur.security.CustomUserDetails;
import ch.noseryoung.domain.recur.utils.TaskUtil;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.http.ResponseEntity;

@Service
public class TaskService {

        private final TaskRepository taskRepository;
        private final ProjectRepository projectRepository;
        private final TaskUtil taskUtil;
        private final GroupMemberVisibilityService visibilityService;

        public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository, TaskUtil taskUtil,
                        GroupMemberVisibilityService visibilityService) {
                this.taskRepository = taskRepository;
                this.projectRepository = projectRepository;
                this.taskUtil = taskUtil;
                this.visibilityService = visibilityService;
        }

        // Ein Task ist sichtbar/bearbeitbar für seinen persönlichen owner, oder -
        // falls er einem Projekt zugeordnet ist - für jedes Mitglied der
        // Projekt-Gruppe (geteiltes Item, alle gleichberechtigt).
        private boolean hasAccess(Task task, User user) {
                if (task.getOwner() != null && task.getOwner().equals(user)) {
                        return true;
                }
                return task.getProject() != null
                                && task.getProject().getGroup() != null
                                && task.getProject().getGroup().getMembers().contains(user);
        }

        // Löst eine vom Client mitgeschickte Projekt-Referenz (nur die id ist
        // relevant) in das gemanagte Project auf und prüft dabei, dass der User
        // Mitglied der zugehörigen Gruppe ist.
        private Project resolveProjectForAssignment(UUID projectId, User user) {
                Project managedProject = projectRepository.findById(projectId)
                                .orElseThrow(() -> new ProjectNotFoundException(projectId));

                if (managedProject.getGroup() == null || !managedProject.getGroup().getMembers().contains(user)) {
                        throw new NotGroupMemberException();
                }

                return managedProject;
        }

        // Baut für die Response eine transiente Kopie mit maskierten Mitgliedern
        // (siehe GroupMemberVisibilityService) - die verwaltete Entity bleibt
        // unangetastet, damit nichts davon in die echten Zuweisungs-/Archiv-
        // Tabellen zurückgeschrieben wird. Persönliche Tasks sind immer nur für
        // ihren eigenen owner sichtbar, daher hier ein No-Op.
        private Task maskMembers(Task task, User viewer) {
                if (task.getProject() == null) {
                        return task;
                }

                Set<User> relevantUsers = new HashSet<>(task.getAssignedMembers());
                relevantUsers.addAll(task.getArchivedBy());
                if (task.getCompletedBy() != null) {
                        relevantUsers.add(task.getCompletedBy());
                }

                Map<UUID, User> maskedById = visibilityService.maskIfHidden(relevantUsers, viewer).stream()
                                .collect(Collectors.toMap(User::getId, u -> u));

                return task.toBuilder()
                                .assignedMembers(task.getAssignedMembers().stream()
                                                .map(u -> maskedById.get(u.getId()))
                                                .collect(Collectors.toCollection(HashSet::new)))
                                .archivedBy(task.getArchivedBy().stream()
                                                .map(u -> maskedById.get(u.getId()))
                                                .collect(Collectors.toCollection(HashSet::new)))
                                .completedBy(task.getCompletedBy() != null
                                                ? maskedById.get(task.getCompletedBy().getId())
                                                : null)
                                .build();
        }

        private Collection<Task> maskMembers(Collection<Task> tasks, User viewer) {
                return tasks.stream().map(task -> maskMembers(task, viewer)).toList();
        }

        // Der Gruppen-Admin (TaskGroup.createdBy) eines Projekt-Tasks - bei
        // persönlichen Tasks immer false.
        private boolean isGroupAdmin(Task task, User user) {
                return task.getProject() != null
                                && task.getProject().getGroup() != null
                                && task.getProject().getGroup().getCreatedBy() != null
                                && task.getProject().getGroup().getCreatedBy().equals(user);
        }

        // Archivieren eines geteilten Projekt-Tasks ist pro Mitglied: wer fertig
        // ist, archiviert nur für sich (archivedBy), der Task bleibt für die
        // anderen zugewiesenen Mitglieder aktiv. Erst wenn alle zugewiesenen
        // Mitglieder archiviert haben, wird der Task global archiviert. Tasks
        // ohne Zuweisung kann nur der Admin direkt archivieren/wieder öffnen.
        // Persönliche Tasks verhalten sich unverändert (einfacher globaler Flag).
        private void applyArchivedChange(Task task, boolean desiredArchived, User actingUser) {
                if (task.getProject() == null) {
                        task.setIsArchived(desiredArchived);
                        return;
                }

                if (!desiredArchived) {
                        task.getArchivedBy().remove(actingUser);
                        task.setIsArchived(false);
                        return;
                }

                if (isGroupAdmin(task, actingUser) && task.getAssignedMembers().isEmpty()) {
                        task.setIsArchived(true);
                        return;
                }

                task.getArchivedBy().add(actingUser);

                boolean allAssignedDone = !task.getAssignedMembers().isEmpty()
                                && task.getArchivedBy().containsAll(task.getAssignedMembers());

                if (allAssignedDone) {
                        task.setIsArchived(true);
                }
        }

        // Bestimmt nach einer Änderung, ob der Task (für geteilte Projekt-Tasks)
        // als erledigt gilt, und pflegt completedBy entsprechend nach - bei
        // persönlichen Tasks bleibt completedBy ungenutzt.
        private void updateCompletedBy(Task task, User actingUser) {
                if (task.getProject() == null) {
                        return;
                }

                boolean isDone = task.getFrequency() == Frequency.ONCE
                                ? task.getAmountDid() != null && task.getAmountDid() > 0
                                : task.getProgress() != null && task.getProgress() >= 100.0;

                task.setCompletedBy(isDone ? actingUser : null);
        }

        // Liest den eingeloggten User aus dem SecurityContext. Funktioniert für
        // JWT-authentifizierte Requests, da JwtAuthenticationFilter ein
        // CustomUserDetails als Principal setzt (siehe JwtAuthenticationFilter).
        private User getCurrentUser() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

                if (authentication == null
                                || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
                        throw new IllegalStateException("Kein authentifizierter User im SecurityContext gefunden");
                }

                return userDetails.getUser();
        }

        // GET METHODS
        public ResponseEntity<Collection<Task>> getTasks(Boolean archived, Boolean favorite) {
                if (archived != null && archived)
                        return getArchivedTasks();

                if (favorite != null && favorite)
                        return getFavoriteTasks();

                User user = getCurrentUser();
                Collection<Task> tasks = taskRepository.findVisibleToUser(user);
                recalculateAll(tasks);

                return ResponseEntity.ok(maskMembers(tasks, user));
        }

        public ResponseEntity<Collection<Task>> getFavoriteTasks() {
                User owner = getCurrentUser();
                List<Task> favoriteTasks = taskRepository.findByOwnerAndIsFavorite(owner, true);
                recalculateAll(favoriteTasks);

                return ResponseEntity.ok(maskMembers(favoriteTasks, owner));
        }

        public ResponseEntity<Collection<Task>> getArchivedTasks() {
                User owner = getCurrentUser();
                List<Task> archivedTasks = taskRepository.findByOwnerAndIsArchived(owner, true);
                recalculateAll(archivedTasks);

                return ResponseEntity.ok(maskMembers(archivedTasks, owner));
        }

        private void recalculateAll(Collection<Task> tasks) {
                tasks.forEach(task -> {
                        TaskUtil.calculateDaysInSpan(task);
                        taskUtil.calculateProgress(task);
                });
        }

        public ResponseEntity<Task> getTask(UUID id) {
                User user = getCurrentUser();
                Task task = taskRepository.findById(id)
                                .filter(t -> hasAccess(t, user))
                                .orElseThrow(() -> new TaskNotFoundException(id));

                return ResponseEntity.ok(maskMembers(task, user));
        }

        // POST METHODS
        public ResponseEntity<Task> createTask(CreateTaskRequest request) {

                User currentUser = getCurrentUser();

                Task task = Task.builder()
                                .name(request.name())
                                .category(request.category())
                                .frequency(request.frequency())
                                .description(request.description())
                                .dateUntil(request.dateUntil())
                                .durationMinutes(request.durationMinutes())
                                .startTime(request.startTime())
                                .build();

                ProjectReference project = request.project();
                if (project != null && project.id() != null) {
                        task.setProject(resolveProjectForAssignment(project.id(), currentUser));
                        task.setOwner(null);
                } else {
                        task.setOwner(currentUser);
                }

                TaskUtil.calculateDaysInSpan(task);
                taskUtil.calculateProgress(task);
                updateCompletedBy(task, currentUser);

                taskRepository.save(task);

                return ResponseEntity.status(201).body(maskMembers(task, currentUser));
        }

        // PATCH METHODS
        public ResponseEntity<Task> patchTask(
                        UUID id,
                        PatchTaskRequest request,
                        Boolean resetProgress,
                        Boolean favorite,
                        Boolean archived,
                        Integer amountDid,
                        Boolean unassignProject) {

                User currentUser = getCurrentUser();
                Task existingTask = taskRepository.findById(id)
                                .filter(t -> hasAccess(t, currentUser))
                                .orElseThrow(() -> new TaskNotFoundException(id));

                if (request.name() != null) {
                        existingTask.setName(request.name());
                }

                if (request.category() != null) {
                        existingTask.setCategory(request.category());
                }

                if (request.description() != null) {
                        existingTask.setDescription(request.description());
                }

                if (request.dateUntil() != null) {
                        existingTask.setDateUntil(request.dateUntil());
                }

                if (request.frequency() != null) {
                        existingTask.setFrequency(request.frequency());
                }

                if (request.durationMinutes() != null) {
                        existingTask.setDurationMinutes(request.durationMinutes());
                }

                if (request.isFavorite() != null) {
                        existingTask.setIsFavorite(request.isFavorite());
                }

                if (request.isArchived() != null) {
                        applyArchivedChange(existingTask, request.isArchived(), currentUser);
                }

                if (favorite != null) {
                        existingTask.setIsFavorite(favorite);
                }

                if (archived != null) {
                        applyArchivedChange(existingTask, archived, currentUser);
                }

                if (resetProgress != null && resetProgress) {
                        existingTask.setAmountDid(0);
                }

                if (amountDid != null) {
                        existingTask.setAmountDid(amountDid);
                }

                if (request.startTime() != null) {
                        existingTask.setStartTime(request.startTime());
                }

                // Nachträgliche Projekt-Zuordnung: entweder explizit auf ein anderes/neues
                // Projekt setzen (mit Mitgliedschafts-Check), oder über unassignProject
                // zurück zu einem persönlichen Task machen.
                ProjectReference project = request.project();
                if (Boolean.TRUE.equals(unassignProject)) {
                        existingTask.setProject(null);
                        existingTask.setOwner(currentUser);
                } else if (project != null && project.id() != null) {
                        existingTask.setProject(resolveProjectForAssignment(project.id(), currentUser));
                        existingTask.setOwner(null);
                }

                TaskUtil.calculateDaysInSpan(existingTask);
                taskUtil.calculateProgress(existingTask);
                updateCompletedBy(existingTask, currentUser);

                taskRepository.save(existingTask);

                return ResponseEntity.ok(maskMembers(existingTask, currentUser));
        }

        // Self-Service: ein Gruppenmitglied weist sich selbst einem geteilten
        // Projekt-Task zu bzw. meldet sich wieder ab. Bei persönlichen Tasks
        // ohne Wirkung, da Zuweisung dort kein Konzept ist.
        public ResponseEntity<Task> assignSelf(UUID id) {
                User currentUser = getCurrentUser();
                Task task = taskRepository.findById(id)
                                .filter(t -> hasAccess(t, currentUser))
                                .orElseThrow(() -> new TaskNotFoundException(id));

                if (task.getProject() != null) {
                        task.getAssignedMembers().add(currentUser);
                        taskRepository.save(task);
                }

                return ResponseEntity.ok(maskMembers(task, currentUser));
        }

        public ResponseEntity<Task> unassignSelf(UUID id) {
                User currentUser = getCurrentUser();
                Task task = taskRepository.findById(id)
                                .filter(t -> hasAccess(t, currentUser))
                                .orElseThrow(() -> new TaskNotFoundException(id));

                task.getAssignedMembers().remove(currentUser);
                task.getArchivedBy().remove(currentUser);
                taskRepository.save(task);

                return ResponseEntity.ok(maskMembers(task, currentUser));
        }

        public ResponseEntity<Task> resetTask(UUID id) {

                User owner = getCurrentUser();
                Task existingTask = taskRepository.findByIdAndOwner(id, owner)
                                .orElseThrow(() -> new TaskNotFoundException(id));

                existingTask.setAmountDid(0);

                TaskUtil.calculateDaysInSpan(existingTask);
                taskUtil.calculateProgress(existingTask);

                taskRepository.save(existingTask);

                return ResponseEntity.ok(existingTask);
        }

        // DELETE METHODS
        public ResponseEntity<Task> deleteTask(UUID id) {

                User user = getCurrentUser();
                Task task = taskRepository.findById(id)
                                .filter(t -> hasAccess(t, user))
                                .orElseThrow(() -> new TaskNotFoundException(id));

                if (!Boolean.TRUE.equals(task.getIsArchived())) {
                        return ResponseEntity.status(403).build();
                }

                taskRepository.deleteById(id);

                return ResponseEntity.ok().build();
        }

        public ResponseEntity<Task> deleteAllTasks() {

                User owner = getCurrentUser();
                taskRepository.deleteByOwner(owner);

                return ResponseEntity.ok().build();
        }
}