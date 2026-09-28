package ch.noseryoung.domain.recur.group.service;

import java.security.SecureRandom;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.user.dto.UserSummary;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.group.dto.CreateGroupRequest;
import ch.noseryoung.domain.recur.group.dto.GroupInvitePreview;
import ch.noseryoung.domain.recur.group.dto.GroupResponse;
import ch.noseryoung.domain.recur.group.event.ProjectsDeletedEvent;
import ch.noseryoung.domain.recur.group.exceptions.AdminSuccessorRequiredException;
import ch.noseryoung.domain.recur.group.exceptions.CannotRemoveAdminException;
import ch.noseryoung.domain.recur.group.exceptions.GroupNotFoundException;
import ch.noseryoung.domain.recur.group.exceptions.InvalidSuccessorException;
import ch.noseryoung.domain.recur.group.exceptions.NotGroupAdminException;
import ch.noseryoung.domain.recur.group.exceptions.NotGroupMemberException;
import ch.noseryoung.domain.recur.group.exceptions.ProjectNotFoundException;
import ch.noseryoung.domain.recur.group.model.Project;
import ch.noseryoung.domain.recur.group.model.TaskGroup;
import ch.noseryoung.domain.recur.group.repository.ProjectRepository;
import ch.noseryoung.domain.recur.group.repository.TaskGroupRepository;
import ch.noseryoung.domain.recur.user.service.CurrentUserService;
import ch.noseryoung.domain.recur.user.service.UserVisibilityService;

@Service
public class GroupService {

    private static final String INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int INVITE_CODE_LENGTH = 8;

    private final TaskGroupRepository taskGroupRepository;
    private final ProjectRepository projectRepository;
    private final CurrentUserService currentUserService;
    private final ApplicationEventPublisher eventPublisher;
    private final UserVisibilityService visibilityService;
    private final SecureRandom random = new SecureRandom();

    public GroupService(TaskGroupRepository taskGroupRepository, ProjectRepository projectRepository,
            CurrentUserService currentUserService, ApplicationEventPublisher eventPublisher,
            UserVisibilityService visibilityService) {
        this.taskGroupRepository = taskGroupRepository;
        this.projectRepository = projectRepository;
        this.currentUserService = currentUserService;
        this.eventPublisher = eventPublisher;
        this.visibilityService = visibilityService;
    }

    // Baut die Response mit maskierten Mitgliedern/Admin (siehe
    // UserVisibilityService) als UserSummary statt vollem User-Objekt.
    private GroupResponse toResponse(TaskGroup group, User viewer) {
        Set<UserSummary> members = visibilityService.maskIfHidden(group.getMembers(), viewer).stream()
                .map(UserSummary::from)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        UserSummary createdBy = UserSummary.from(visibilityService.maskIfHidden(group.getCreatedBy(), viewer));

        return GroupResponse.from(group, createdBy, members);
    }

    private String generateUniqueInviteCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(INVITE_CODE_LENGTH);
            for (int i = 0; i < INVITE_CODE_LENGTH; i++) {
                sb.append(INVITE_CODE_ALPHABET.charAt(random.nextInt(INVITE_CODE_ALPHABET.length())));
            }
            code = sb.toString();
        } while (taskGroupRepository.existsByInviteCode(code));
        return code;
    }

    private TaskGroup requireMembership(UUID groupId, User user) {
        TaskGroup group = taskGroupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException(groupId));

        if (!group.getMembers().contains(user)) {
            throw new NotGroupMemberException();
        }

        return group;
    }

    private boolean isAdmin(TaskGroup group, User user) {
        return group.getCreatedBy() != null && group.getCreatedBy().equals(user);
    }

    private void requireAdmin(TaskGroup group, User user) {
        if (!isAdmin(group, user)) {
            throw new NotGroupAdminException();
        }
    }

    public ResponseEntity<GroupResponse> createGroup(CreateGroupRequest request) {
        User currentUser = currentUserService.get();

        TaskGroup newGroup = TaskGroup.builder()
                .name(request.name())
                .inviteCode(generateUniqueInviteCode())
                .createdBy(currentUser)
                .build();
        newGroup.getMembers().add(currentUser);

        taskGroupRepository.save(newGroup);

        return ResponseEntity.status(201).body(toResponse(newGroup, currentUser));
    }

    public ResponseEntity<Collection<GroupResponse>> getMyGroups() {
        User currentUser = currentUserService.get();
        List<TaskGroup> groups = taskGroupRepository.findByMembersContaining(currentUser);
        List<GroupResponse> responses = groups.stream().map(group -> toResponse(group, currentUser)).toList();
        return ResponseEntity.ok(responses);
    }

    public ResponseEntity<GroupResponse> getGroup(UUID id) {
        User currentUser = currentUserService.get();
        TaskGroup group = requireMembership(id, currentUser);
        return ResponseEntity.ok(toResponse(group, currentUser));
    }

    // Projekte aller eigenen Gruppen in einem Rutsch statt einem Request pro
    // Gruppe (das Frontend pollt getGroups()+getProjects(id) alle 15s - ohne
    // diesen Endpunkt wäre das N+1 Requests pro Poll).
    @Transactional(readOnly = true)
    public ResponseEntity<Map<UUID, List<Project>>> getProjectsForMyGroups() {
        List<TaskGroup> groups = taskGroupRepository.findByMembersContaining(currentUserService.get());
        List<Project> projects = projectRepository.findByGroupIn(groups);

        Map<UUID, List<Project>> projectsByGroupId = projects.stream()
                .collect(Collectors.groupingBy(project -> project.getGroup().getId()));

        // Gruppen ohne Projekte tauchen sonst gar nicht als Key auf - das
        // Frontend erwartet pro Gruppe zumindest eine leere Liste.
        groups.forEach(group -> projectsByGroupId.putIfAbsent(group.getId(), List.of()));

        return ResponseEntity.ok(projectsByGroupId);
    }

    public ResponseEntity<GroupInvitePreview> previewInvite(String inviteCode) {
        TaskGroup group = taskGroupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new GroupNotFoundException(inviteCode));

        return ResponseEntity.ok(GroupInvitePreview.of(group, currentUserService.get()));
    }

    public ResponseEntity<GroupResponse> joinGroup(String inviteCode) {
        User currentUser = currentUserService.get();
        TaskGroup group = taskGroupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new GroupNotFoundException(inviteCode));

        group.getMembers().add(currentUser);
        taskGroupRepository.save(group);

        return ResponseEntity.ok(toResponse(group, currentUser));
    }

    // Normales Mitglied: entfernt einfach sich selbst. Admin: muss - ausser er
    // ist das letzte verbleibende Mitglied - vorher per successorId einen
    // Nachfolger bestimmen, sonst bliebe die Gruppe führungslos zurück.
    @Transactional
    public ResponseEntity<Void> leaveGroup(UUID groupId, UUID successorId) {
        User currentUser = currentUserService.get();
        TaskGroup group = requireMembership(groupId, currentUser);

        if (isAdmin(group, currentUser)) {
            boolean hasOtherMembers = group.getMembers().stream()
                    .anyMatch(member -> !member.equals(currentUser));

            if (!hasOtherMembers) {
                // Letztes Mitglied: die Gruppe kann von niemandem mehr genutzt
                // werden, also gleich ganz löschen statt sie leer zurückzulassen.
                deleteGroupInternal(group);
                return ResponseEntity.ok().build();
            }

            if (successorId == null) {
                throw new AdminSuccessorRequiredException();
            }

            User successor = group.getMembers().stream()
                    .filter(member -> member.getId().equals(successorId) && !member.equals(currentUser))
                    .findFirst()
                    .orElseThrow(InvalidSuccessorException::new);

            group.setCreatedBy(successor);
        }

        group.getMembers().remove(currentUser);
        taskGroupRepository.save(group);

        return ResponseEntity.ok().build();
    }

    // Nur der Admin darf andere Mitglieder entfernen. Der Admin selbst kann
    // darüber nicht entfernt werden - dafür gibt es leaveGroup (mit Nachfolger)
    // bzw. transferAdmin.
    public ResponseEntity<Void> removeMember(UUID groupId, UUID memberId) {
        User currentUser = currentUserService.get();
        TaskGroup group = requireMembership(groupId, currentUser);
        requireAdmin(group, currentUser);

        if (group.getCreatedBy() != null && group.getCreatedBy().getId().equals(memberId)) {
            throw new CannotRemoveAdminException();
        }

        group.getMembers().removeIf(member -> member.getId().equals(memberId));
        taskGroupRepository.save(group);

        return ResponseEntity.ok().build();
    }

    // Der Admin kann die Rolle jederzeit frei an ein anderes Mitglied
    // übergeben, unabhängig vom Verlassen der Gruppe.
    public ResponseEntity<GroupResponse> transferAdmin(UUID groupId, UUID newAdminId) {
        User currentUser = currentUserService.get();
        TaskGroup group = requireMembership(groupId, currentUser);
        requireAdmin(group, currentUser);

        User newAdmin = group.getMembers().stream()
                .filter(member -> member.getId().equals(newAdminId) && !member.equals(currentUser))
                .findFirst()
                .orElseThrow(InvalidSuccessorException::new);

        group.setCreatedBy(newAdmin);
        taskGroupRepository.save(group);

        return ResponseEntity.ok(toResponse(group, currentUser));
    }

    // Löscht die Gruppe komplett kaskadierend: erst alle Tasks der Projekte,
    // dann die Projekte, dann die Gruppe selbst. Nur der Admin darf das - die
    // Bestätigung mit den noch aktiven Tasks passiert im Frontend vor diesem
    // Aufruf.
    @Transactional
    public ResponseEntity<Void> deleteGroup(UUID groupId) {
        User currentUser = currentUserService.get();
        TaskGroup group = requireMembership(groupId, currentUser);
        requireAdmin(group, currentUser);

        deleteGroupInternal(group);

        return ResponseEntity.ok().build();
    }

    // Löst eine vom Client mitgeschickte Projekt-Referenz auf und prüft dabei,
    // dass der User Mitglied der zugehörigen Gruppe ist - task darf group's
    // Repository nicht direkt aufrufen (siehe TaskService#resolveProjectForAssignment).
    public Project requireProjectForMember(UUID projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));

        if (project.getGroup() == null || !project.getGroup().getMembers().contains(user)) {
            throw new NotGroupMemberException();
        }

        return project;
    }

    // Für TaskService's ProjectsDeletedEvent-Listener - lädt die Projekte, deren
    // Tasks gelöscht werden müssen, ohne dass task group's Repository direkt
    // aufrufen muss.
    public List<Project> findProjectsByIds(Collection<UUID> projectIds) {
        return projectRepository.findAllById(projectIds);
    }

    private void deleteGroupInternal(TaskGroup group) {
        List<Project> projects = projectRepository.findByGroup(group);
        if (!projects.isEmpty()) {
            // Muss vor dem Löschen der Projekte passieren (siehe TaskService's
            // @EventListener) - group darf task's Repository nicht direkt
            // aufrufen.
            eventPublisher.publishEvent(new ProjectsDeletedEvent(projects.stream().map(Project::getId).toList()));
            projectRepository.deleteByGroup(group);
        }

        taskGroupRepository.delete(group);
    }
}
