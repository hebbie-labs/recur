package ch.noseryoung.domain.recur.task.service;

import ch.noseryoung.domain.recur.user.service.UserVisibilityService;

import ch.noseryoung.domain.recur.task.dto.CreateTaskRequest;
import ch.noseryoung.domain.recur.task.dto.PatchTaskRequest;
import ch.noseryoung.domain.recur.task.dto.ProjectReference;
import ch.noseryoung.domain.recur.task.dto.TaskResponse;
import ch.noseryoung.domain.recur.task.enums.Frequency;
import ch.noseryoung.domain.recur.task.exceptions.InvalidCompletionException;
import ch.noseryoung.domain.recur.task.exceptions.TaskNotFoundException;
import ch.noseryoung.domain.recur.task.model.Task;
import ch.noseryoung.domain.recur.task.model.TaskReminderOverride;
import ch.noseryoung.domain.recur.task.repository.TaskReminderOverrideRepository;
import ch.noseryoung.domain.recur.task.repository.TaskRepository;
import ch.noseryoung.domain.recur.task.enums.ReminderLeadTime;
import ch.noseryoung.domain.recur.task.event.ProjectTaskCreatedEvent;
import ch.noseryoung.domain.recur.task.event.TasksDeletedEvent;
import ch.noseryoung.domain.recur.group.event.ProjectsDeletedEvent;
import ch.noseryoung.domain.recur.group.exceptions.NotGroupAdminException;
import ch.noseryoung.domain.recur.group.model.Project;
import ch.noseryoung.domain.recur.group.service.GroupService;
import ch.noseryoung.domain.recur.user.dto.UserSummary;
import ch.noseryoung.domain.recur.user.event.UserDeletedEvent;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.service.CurrentUserService;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.http.ResponseEntity;

@Service
public class TaskService {

        private final TaskRepository taskRepository;
        private final GroupService groupService;
        private final TaskUtil taskUtil;
        private final UserVisibilityService visibilityService;
        private final CurrentUserService currentUserService;
        private final ApplicationEventPublisher eventPublisher;
        private final TaskReminderOverrideRepository taskReminderOverrideRepository;

        public TaskService(TaskRepository taskRepository, GroupService groupService, TaskUtil taskUtil,
                        UserVisibilityService visibilityService,
                        CurrentUserService currentUserService,
                        ApplicationEventPublisher eventPublisher,
                        TaskReminderOverrideRepository taskReminderOverrideRepository) {
                this.taskRepository = taskRepository;
                this.groupService = groupService;
                this.taskUtil = taskUtil;
                this.visibilityService = visibilityService;
                this.currentUserService = currentUserService;
                this.eventPublisher = eventPublisher;
                this.taskReminderOverrideRepository = taskReminderOverrideRepository;
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
        // relevant) auf und prüft dabei, dass der User Mitglied der zugehörigen
        // Gruppe ist - über GroupService statt direktem Repository-Zugriff auf
        // eine andere Domain.
        private Project resolveProjectForAssignment(UUID projectId, User user) {
                return groupService.requireProjectForMember(projectId, user);
        }

        // Baut die Response mit maskierten Mitgliedern (siehe UserVisibilityService)
        // als UserSummary statt vollem User-Objekt - die verwaltete Entity bleibt
        // unangetastet. Persönliche Tasks sind immer nur für ihren eigenen owner
        // sichtbar, daher hier sonst kein Masking nötig.
        //
        // Befüllt ausserdem reminderLeadTime mit dem Override des jeweiligen
        // viewer für diesen Task (#102-Follow-up) - dieser gemeinsame
        // Response-Pfad ist der einzige Ort, an dem ein Task je nach Betrachter
        // unterschiedlich befüllt zurückgegeben wird, daher hier statt an jeder
        // einzelnen Aufrufstelle.
        private TaskResponse toResponse(Task task, User viewer) {
                ReminderLeadTime reminderLeadTime = taskReminderOverrideRepository.findByTaskAndUser(task, viewer)
                                .map(TaskReminderOverride::getReminderLeadTime)
                                .orElse(null);

                if (task.getProject() == null) {
                        return TaskResponse.from(task, reminderLeadTime, null, null, Set.of(), Set.of());
                }

                Set<User> relevantUsers = new HashSet<>(task.getAssignedMembers());
                relevantUsers.addAll(task.getArchivedBy());
                if (task.getCompletedBy() != null) {
                        relevantUsers.add(task.getCompletedBy());
                }

                Map<UUID, User> maskedById = visibilityService.maskIfHidden(relevantUsers, viewer).stream()
                                .collect(Collectors.toMap(User::getId, u -> u));

                Set<UserSummary> assignedMembers = task.getAssignedMembers().stream()
                                .map(u -> UserSummary.from(maskedById.get(u.getId())))
                                .collect(Collectors.toCollection(LinkedHashSet::new));
                Set<UserSummary> archivedBy = task.getArchivedBy().stream()
                                .map(u -> UserSummary.from(maskedById.get(u.getId())))
                                .collect(Collectors.toCollection(LinkedHashSet::new));
                UserSummary completedBy = task.getCompletedBy() != null
                                ? UserSummary.from(maskedById.get(task.getCompletedBy().getId()))
                                : null;

                return TaskResponse.from(task, reminderLeadTime, TaskResponse.ProjectSummary.from(task.getProject()),
                                completedBy, assignedMembers, archivedBy);
        }

        private Collection<TaskResponse> toResponses(Collection<Task> tasks, User viewer) {
                return tasks.stream().map(task -> toResponse(task, viewer)).toList();
        }

        // Für addCompletion/removeCompletion (nur persönliche Tasks, kein
        // Projekt, keine Mitglieder zu maskieren) - bewusst ohne den
        // Erinnerungs-Override-Lookup von toResponse, diesen Pfad hat das schon
        // vor der DTO-Einführung nie befüllt.
        private TaskResponse toPersonalResponse(Task task) {
                return TaskResponse.from(task, null, null, null, Set.of(), Set.of());
        }

        // Der Gruppen-Admin (TaskGroup.createdBy) eines Projekt-Tasks - bei
        // persönlichen Tasks immer false.
        private boolean isGroupAdmin(Task task, User user) {
                return task.getProject() != null
                                && task.getProject().getGroup() != null
                                && task.getProject().getGroup().getCreatedBy() != null
                                && task.getProject().getGroup().getCreatedBy().equals(user);
        }

        // Wer einen Projekt-Task nach dem Archivieren für ALLE Mitglieder
        // endgültig löschen darf (TaskService#deleteTask) - normalerweise sein
        // Ersteller. Bestandstasks von vor diesem Feld haben createdBy=null,
        // dort greift ersatzweise der Gruppen-Admin.
        private boolean isTaskCreator(Task task, User user) {
                return task.getCreatedBy() != null ? task.getCreatedBy().equals(user) : isGroupAdmin(task, user);
        }

        // Spiegelt TasksContext#isArchivedForCurrentUser im Frontend: bei einem
        // geteilten Projekt-Task zählt sowohl der globale isArchived-Flag als
        // auch ein individueller Eintrag in archivedBy.
        private boolean isArchivedForCurrentUser(Task task, User user) {
                if (Boolean.TRUE.equals(task.getIsArchived())) {
                        return true;
                }
                return task.getProject() != null && task.getArchivedBy().contains(user);
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

        // #155: ein archiviertes Habit ist read-only - weder Abhaken noch
        // nachträgliches Ändern des Verlaufs. Gilt für persönliche Tasks
        // (addCompletion/removeCompletion) wie für geteilte Projekt-Tasks
        // (patchTask amountDid/resetProgress).
        private void assertNotArchived(Task task, User actingUser) {
                if (isArchivedForCurrentUser(task, actingUser)) {
                        throw new InvalidCompletionException("Archivierte Aufgaben können nicht mehr bearbeitet werden");
                }
        }

        // GET METHODS
        public ResponseEntity<Collection<TaskResponse>> getTasks(Boolean archived, Boolean favorite) {
                if (archived != null && archived)
                        return getArchivedTasks();

                if (favorite != null && favorite)
                        return getFavoriteTasks();

                User user = currentUserService.get();
                Collection<Task> tasks = taskRepository.findVisibleToUser(user);
                recalculateAll(tasks);

                return ResponseEntity.ok(toResponses(tasks, user));
        }

        public ResponseEntity<Collection<TaskResponse>> getFavoriteTasks() {
                User owner = currentUserService.get();
                List<Task> favoriteTasks = taskRepository.findByOwnerAndIsFavorite(owner, true);
                recalculateAll(favoriteTasks);

                return ResponseEntity.ok(toResponses(favoriteTasks, owner));
        }

        public ResponseEntity<Collection<TaskResponse>> getArchivedTasks() {
                User owner = currentUserService.get();
                List<Task> archivedTasks = taskRepository.findByOwnerAndIsArchived(owner, true);
                recalculateAll(archivedTasks);

                return ResponseEntity.ok(toResponses(archivedTasks, owner));
        }

        private void recalculateAll(Collection<Task> tasks) {
                tasks.forEach(this::recalculate);
        }

        // #161: amountDid/progress/lastAmountDidAt sind für persönliche Tasks
        // vollständig aus completions abgeleitet (3NF) - der gespeicherte
        // Spaltenwert ist daher nie vertrauenswürdig und wird vor JEDER Response
        // frisch berechnet, statt sich auf einen zuvor korrekt geschriebenen
        // Stand zu verlassen. Geteilte Projekt-Tasks kennen keine completions und
        // behalten ihre bestehende, direkt gesetzte amountDid-Logik (PATCH
        // ?amountDid=..) unverändert.
        private void recalculate(Task task) {
                TaskUtil.calculateDaysInSpan(task);
                if (task.getOwner() != null) {
                        taskUtil.syncCompletions(task);
                }
                taskUtil.calculateProgress(task);
        }

        public ResponseEntity<TaskResponse> getTask(UUID id) {
                User user = currentUserService.get();
                Task task = taskRepository.findById(id)
                                .filter(t -> hasAccess(t, user))
                                .orElseThrow(() -> new TaskNotFoundException(id));

                recalculate(task);

                return ResponseEntity.ok(toResponse(task, user));
        }

        // POST METHODS
        public ResponseEntity<TaskResponse> createTask(CreateTaskRequest request) {

                User currentUser = currentUserService.get();

                Task task = Task.builder()
                                .name(request.name())
                                .category(request.category())
                                .frequency(request.frequency())
                                .description(request.description())
                                .dateUntil(request.dateUntil())
                                .durationMinutes(request.durationMinutes())
                                .startTime(request.startTime())
                                .createdBy(currentUser)
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
                notifyGroupOfNewProjectTask(task, currentUser);

                return ResponseEntity.status(201).body(toResponse(task, currentUser));
        }

        // #102: benachrichtigt alle übrigen Gruppenmitglieder, wenn jemand einen
        // neuen geteilten Projekt-Task erstellt hat. Persönliche Tasks (kein
        // project) betreffen niemand anderen und lösen daher nichts aus. Läuft
        // über ein Event statt eines direkten Aufrufs, da task nicht von
        // notification abhängen darf (siehe ProjectTaskCreatedEvent).
        private void notifyGroupOfNewProjectTask(Task task, User creator) {
                if (task.getProject() == null || task.getProject().getGroup() == null) {
                        return;
                }

                List<User> recipients = task.getProject().getGroup().getMembers().stream()
                                .filter(member -> !member.equals(creator))
                                .toList();

                if (!recipients.isEmpty()) {
                        eventPublisher.publishEvent(new ProjectTaskCreatedEvent(task, creator, recipients));
                }
        }

        // Für TaskReminderScheduler (#102): Kandidaten für Erinnerung/Überfällig -
        // notification darf task's Repository nicht direkt aufrufen.
        public List<Task> findDueTasks() {
                return taskRepository.findByIsArchivedFalseAndDateUntilIsNotNull();
        }

        // Für TaskReminderScheduler#leadTimeOf - der vom Empfänger selbst für
        // diesen Task gesetzte Erinnerungs-Vorlauf-Override, falls vorhanden.
        public Optional<ReminderLeadTime> reminderLeadTimeOverride(Task task, User recipient) {
                return taskReminderOverrideRepository.findByTaskAndUser(task, recipient)
                                .map(TaskReminderOverride::getReminderLeadTime);
        }

        // Räumt beim Löschen eines Accounts (siehe UserService#deleteCurrentUser)
        // die task-eigenen Referenzen auf den User auf - muss synchron laufen,
        // bevor UserService den User selbst löscht, sonst schlagen die
        // FK-Constraints von task.created_by_id bzw. task_hidden_for fehl.
        @EventListener
        public void onUserDeleted(UserDeletedEvent event) {
                User user = new User();
                user.setId(event.userId());

                taskRepository.clearCreatedBy(user);
                List<Task> hiddenTasks = taskRepository.findByHiddenForContaining(user);
                hiddenTasks.forEach(task -> task.getHiddenFor().remove(user));
                taskRepository.saveAll(hiddenTasks);
        }

        // Räumt beim Löschen eines Projekts/einer Gruppe (siehe
        // ProjectService#deleteProject, GroupService#deleteGroupInternal) dessen
        // Tasks auf - läuft über ein Event statt eines direkten Aufrufs von
        // group aus, da group nicht von task's Repository abhängen darf.
        @EventListener
        public void onProjectsDeleted(ProjectsDeletedEvent event) {
                List<Project> projects = groupService.findProjectsByIds(event.projectIds());
                List<Task> tasks = taskRepository.findByProjectIn(projects);

                if (!tasks.isEmpty()) {
                        eventPublisher.publishEvent(new TasksDeletedEvent(tasks.stream().map(Task::getId).toList()));
                }

                taskRepository.deleteByProjectIn(projects);
        }

        // PATCH METHODS
        public ResponseEntity<TaskResponse> patchTask(
                        UUID id,
                        PatchTaskRequest request,
                        Boolean resetProgress,
                        Boolean favorite,
                        Boolean archived,
                        Integer amountDid,
                        Boolean unassignProject,
                        Boolean hidden) {

                User currentUser = currentUserService.get();
                Task existingTask = taskRepository.findById(id)
                                .filter(t -> hasAccess(t, currentUser))
                                .orElseThrow(() -> new TaskNotFoundException(id));

                boolean editsAdminFields = request.name() != null
                                || request.category() != null
                                || request.description() != null
                                || request.dateUntil() != null
                                || request.frequency() != null
                                || request.durationMinutes() != null
                                || request.startTime() != null;
                if (editsAdminFields && existingTask.getProject() != null && !isGroupAdmin(existingTask, currentUser)) {
                        throw new NotGroupAdminException();
                }

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

                // Undo für ein per DELETE ausgeblendetes Mitglied (TaskService#deleteTask,
                // siehe hiddenFor) - "wieder einblenden" ist der einzige unterstützte
                // Fall, hidden=true gibt es nicht (das läuft über DELETE).
                if (Boolean.FALSE.equals(hidden)) {
                        existingTask.getHiddenFor().remove(currentUser);
                }

                boolean isResetProgress = resetProgress != null && resetProgress;

                if ((isResetProgress || amountDid != null) && isArchivedForCurrentUser(existingTask, currentUser)) {
                        throw new InvalidCompletionException("Archivierte Aufgaben können nicht mehr bearbeitet werden");
                }

                if (isResetProgress) {
                        existingTask.getCompletions().clear();
                        existingTask.setAmountDid(0);
                        existingTask.setLastAmountDidAt(null);
                }

                // Nur noch für geteilte Projekt-Tasks relevant (#152: persönliche
                // Tasks laufen über addCompletion/removeCompletion, siehe unten).
                if (amountDid != null && !isResetProgress) {
                        existingTask.setAmountDid(amountDid);
                        existingTask.setLastAmountDidAt(Instant.now());
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

                return ResponseEntity.ok(toResponse(existingTask, currentUser));
        }

        // Self-Service: ein Gruppenmitglied weist sich selbst einem geteilten
        // Projekt-Task zu bzw. meldet sich wieder ab. Bei persönlichen Tasks
        // ohne Wirkung, da Zuweisung dort kein Konzept ist.
        public ResponseEntity<TaskResponse> assignSelf(UUID id) {
                User currentUser = currentUserService.get();
                Task task = taskRepository.findById(id)
                                .filter(t -> hasAccess(t, currentUser))
                                .orElseThrow(() -> new TaskNotFoundException(id));

                if (task.getProject() != null) {
                        task.getAssignedMembers().add(currentUser);
                        taskRepository.save(task);
                }

                return ResponseEntity.ok(toResponse(task, currentUser));
        }

        public ResponseEntity<TaskResponse> unassignSelf(UUID id) {
                User currentUser = currentUserService.get();
                Task task = taskRepository.findById(id)
                                .filter(t -> hasAccess(t, currentUser))
                                .orElseThrow(() -> new TaskNotFoundException(id));

                task.getAssignedMembers().remove(currentUser);
                task.getArchivedBy().remove(currentUser);
                taskRepository.save(task);

                return ResponseEntity.ok(toResponse(task, currentUser));
        }

        // Setzt/löscht den Erinnerungs-Vorlauf-Override des aktuellen Users für
        // diesen Task (#102-Follow-up). Bewusst ein eigener Endpoint statt Teil
        // von PatchTaskRequest: bei geteilten Projekt-Tasks darf ein Mitglied
        // damit nur seine eigene Erinnerung ändern, nie die der anderen
        // zugewiesenen Mitglieder. leadTime == null löscht den Override wieder
        // (zurück auf die Kontoeinstellung).
        public ResponseEntity<TaskResponse> setReminderLeadTime(UUID id, ReminderLeadTime leadTime) {
                User currentUser = currentUserService.get();
                Task task = taskRepository.findById(id)
                                .filter(t -> hasAccess(t, currentUser))
                                .orElseThrow(() -> new TaskNotFoundException(id));

                Optional<TaskReminderOverride> existing = taskReminderOverrideRepository.findByTaskAndUser(task,
                                currentUser);

                if (leadTime == null) {
                        existing.ifPresent(taskReminderOverrideRepository::delete);
                } else if (existing.isPresent()) {
                        existing.get().setReminderLeadTime(leadTime);
                        taskReminderOverrideRepository.save(existing.get());
                } else {
                        taskReminderOverrideRepository.save(TaskReminderOverride.builder()
                                        .task(task)
                                        .user(currentUser)
                                        .reminderLeadTime(leadTime)
                                        .build());
                }

                return ResponseEntity.ok(toResponse(task, currentUser));
        }

        // COMPLETION METHODS (#152) - nachträgliches Abhaken/Rückgängig einzelner
        // Tage. Nur für persönliche Tasks (findByIdAndOwner statt hasAccess),
        // Projekt-Tasks bleiben bei ihrer bestehenden completedBy-Logik.
        public ResponseEntity<TaskResponse> addCompletion(UUID id, LocalDate date) {
                User owner = currentUserService.get();
                Task task = taskRepository.findByIdAndOwner(id, owner)
                                .orElseThrow(() -> new TaskNotFoundException(id));

                assertNotArchived(task, owner);
                validateCompletionDate(task, date);
                // Erst bestehenden amountDid-Zähler (Bestandstasks vor #152) in echte
                // Completions zurückübersetzen, sonst würde die Intervall-Prüfung
                // unten dessen Historie nicht kennen.
                taskUtil.backfillLegacyCompletionsIfNeeded(task);

                if (!task.getCompletions().contains(date)) {
                        assertNoIntervalConflict(task, date);
                        task.getCompletions().add(date);
                }

                TaskUtil.calculateDaysInSpan(task);
                taskUtil.deriveFromCompletions(task);
                taskUtil.calculateProgress(task);
                taskRepository.save(task);

                return ResponseEntity.ok(toPersonalResponse(task));
        }

        public ResponseEntity<TaskResponse> removeCompletion(UUID id, LocalDate date) {
                User owner = currentUserService.get();
                Task task = taskRepository.findByIdAndOwner(id, owner)
                                .orElseThrow(() -> new TaskNotFoundException(id));

                assertNotArchived(task, owner);
                // Backfill zuerst, damit "Rückgängig" bei einem Bestandstask (noch
                // keine echten Completions, nur der alte amountDid-Zähler) überhaupt
                // ein konkretes Datum zum Entfernen hat.
                taskUtil.backfillLegacyCompletionsIfNeeded(task);
                task.getCompletions().remove(date);

                TaskUtil.calculateDaysInSpan(task);
                taskUtil.deriveFromCompletions(task);
                taskUtil.calculateProgress(task);
                taskRepository.save(task);

                return ResponseEntity.ok(toPersonalResponse(task));
        }

        private void validateCompletionDate(Task task, LocalDate date) {
                if (date.isAfter(LocalDate.now(ZoneOffset.UTC))) {
                        throw new InvalidCompletionException("Ein Tag in der Zukunft kann nicht abgehakt werden");
                }

                if (task.getDateCreated() != null
                                && date.isBefore(task.getDateCreated().atZone(ZoneOffset.UTC).toLocalDate())) {
                        throw new InvalidCompletionException("Das Datum liegt vor der Erstellung dieser Aufgabe");
                }
        }

        // Verhindert, dass für dasselbe Frequenz-Intervall (z.B. dieselbe Woche
        // bei WEEKLY) an zwei verschiedenen Tagen abgehakt wird - amountDid zählt
        // sonst mehr Wiederholungen als tatsächlich verstrichen sind. Bei ONCE
        // gibt es kein Intervall, dort ist stattdessen insgesamt nur 1 Completion
        // erlaubt.
        private void assertNoIntervalConflict(Task task, LocalDate date) {
                if (task.getFrequency() == Frequency.ONCE) {
                        if (!task.getCompletions().isEmpty()) {
                                throw new InvalidCompletionException("Dieser Task wurde bereits als erledigt markiert");
                        }
                        return;
                }

                Long intervalIndex = taskUtil.intervalIndexOf(task, date);
                if (intervalIndex == null) {
                        return;
                }

                boolean alreadyCoveredByAnotherDay = task.getCompletions().stream()
                                .anyMatch(existing -> intervalIndex.equals(taskUtil.intervalIndexOf(task, existing)));
                if (alreadyCoveredByAnotherDay) {
                        throw new InvalidCompletionException("Für dieses Frequenz-Intervall wurde bereits ein Tag abgehakt");
                }
        }

        // DELETE METHODS
        //
        // Persönliche Tasks und der Ersteller eines Projekt-Tasks löschen
        // endgültig für alle (200, kein Body, wie bisher). Ein anderes Gruppenmitglied kann
        // einen archivierten Projekt-Task nur für sich ausblenden (hiddenFor) -
        // die anderen zugewiesenen Mitglieder behalten ihn. Rückgängig machbar
        // über PATCH ?hidden=false, daher hier 200 mit dem aktualisierten Task
        // als Body, damit das Frontend einen Undo-Toast anbieten kann.
        public ResponseEntity<TaskResponse> deleteTask(UUID id) {

                User user = currentUserService.get();
                Task task = taskRepository.findById(id)
                                .filter(t -> hasAccess(t, user))
                                .orElseThrow(() -> new TaskNotFoundException(id));

                if (!isArchivedForCurrentUser(task, user)) {
                        return ResponseEntity.status(403).build();
                }

                if (task.getProject() == null || isTaskCreator(task, user)) {
                        eventPublisher.publishEvent(new TasksDeletedEvent(List.of(id)));
                        taskRepository.deleteById(id);
                        return ResponseEntity.ok().build();
                }

                task.getHiddenFor().add(user);
                taskRepository.save(task);

                return ResponseEntity.ok(toResponse(task, user));
        }

        public ResponseEntity<TaskResponse> deleteAllTasks() {

                User owner = currentUserService.get();
                List<Task> tasks = taskRepository.findByOwner(owner);

                if (!tasks.isEmpty()) {
                        eventPublisher.publishEvent(new TasksDeletedEvent(tasks.stream().map(Task::getId).toList()));
                }

                taskRepository.deleteByOwner(owner);

                return ResponseEntity.ok().build();
        }
}