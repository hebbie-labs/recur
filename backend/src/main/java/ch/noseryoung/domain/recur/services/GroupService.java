package ch.noseryoung.domain.recur.services;

import java.security.SecureRandom;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.dto.CreateGroupRequest;
import ch.noseryoung.domain.recur.dto.GroupInvitePreview;
import ch.noseryoung.domain.recur.exceptions.AdminSuccessorRequiredException;
import ch.noseryoung.domain.recur.exceptions.CannotRemoveAdminException;
import ch.noseryoung.domain.recur.exceptions.GroupNotFoundException;
import ch.noseryoung.domain.recur.exceptions.InvalidSuccessorException;
import ch.noseryoung.domain.recur.exceptions.NotGroupAdminException;
import ch.noseryoung.domain.recur.exceptions.NotGroupMemberException;
import ch.noseryoung.domain.recur.models.Project;
import ch.noseryoung.domain.recur.models.TaskGroup;
import ch.noseryoung.domain.recur.models.User;
import ch.noseryoung.domain.recur.repositories.ProjectRepository;
import ch.noseryoung.domain.recur.repositories.TaskGroupRepository;
import ch.noseryoung.domain.recur.repositories.TaskRepository;
import ch.noseryoung.domain.recur.security.CustomUserDetails;

@Service
public class GroupService {

    private static final String INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int INVITE_CODE_LENGTH = 8;

    private final TaskGroupRepository taskGroupRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final GroupMemberVisibilityService visibilityService;
    private final SecureRandom random = new SecureRandom();

    public GroupService(TaskGroupRepository taskGroupRepository, ProjectRepository projectRepository,
            TaskRepository taskRepository, GroupMemberVisibilityService visibilityService) {
        this.taskGroupRepository = taskGroupRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.visibilityService = visibilityService;
    }

    // Baut eine transiente Response-Kopie mit maskierten Mitgliedern/Admin -
    // die verwaltete Entity bleibt unangetastet (siehe GroupMemberVisibilityService).
    private TaskGroup maskMembers(TaskGroup group, User viewer) {
        return group.toBuilder()
                .members(visibilityService.maskIfHidden(group.getMembers(), viewer))
                .createdBy(visibilityService.maskIfHidden(group.getCreatedBy(), viewer))
                .build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalStateException("Kein authentifizierter User im SecurityContext gefunden");
        }

        return userDetails.getUser();
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

    public ResponseEntity<TaskGroup> createGroup(CreateGroupRequest request) {
        User currentUser = getCurrentUser();

        TaskGroup newGroup = TaskGroup.builder()
                .name(request.name())
                .inviteCode(generateUniqueInviteCode())
                .createdBy(currentUser)
                .build();
        newGroup.getMembers().add(currentUser);

        taskGroupRepository.save(newGroup);

        return ResponseEntity.status(201).body(newGroup);
    }

    public ResponseEntity<Collection<TaskGroup>> getMyGroups() {
        User currentUser = getCurrentUser();
        List<TaskGroup> groups = taskGroupRepository.findByMembersContaining(currentUser);
        List<TaskGroup> masked = groups.stream().map(group -> maskMembers(group, currentUser)).toList();
        return ResponseEntity.ok(masked);
    }

    public ResponseEntity<TaskGroup> getGroup(UUID id) {
        User currentUser = getCurrentUser();
        TaskGroup group = requireMembership(id, currentUser);
        return ResponseEntity.ok(maskMembers(group, currentUser));
    }

    // Projekte aller eigenen Gruppen in einem Rutsch statt einem Request pro
    // Gruppe (das Frontend pollt getGroups()+getProjects(id) alle 15s - ohne
    // diesen Endpunkt wäre das N+1 Requests pro Poll).
    @Transactional(readOnly = true)
    public ResponseEntity<Map<UUID, List<Project>>> getProjectsForMyGroups() {
        List<TaskGroup> groups = taskGroupRepository.findByMembersContaining(getCurrentUser());
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

        return ResponseEntity.ok(GroupInvitePreview.of(group, getCurrentUser()));
    }

    public ResponseEntity<TaskGroup> joinGroup(String inviteCode) {
        User currentUser = getCurrentUser();
        TaskGroup group = taskGroupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new GroupNotFoundException(inviteCode));

        group.getMembers().add(currentUser);
        taskGroupRepository.save(group);

        return ResponseEntity.ok(maskMembers(group, currentUser));
    }

    // Normales Mitglied: entfernt einfach sich selbst. Admin: muss - ausser er
    // ist das letzte verbleibende Mitglied - vorher per successorId einen
    // Nachfolger bestimmen, sonst bliebe die Gruppe führungslos zurück.
    @Transactional
    public ResponseEntity<Void> leaveGroup(UUID groupId, UUID successorId) {
        User currentUser = getCurrentUser();
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
        User currentUser = getCurrentUser();
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
    public ResponseEntity<TaskGroup> transferAdmin(UUID groupId, UUID newAdminId) {
        User currentUser = getCurrentUser();
        TaskGroup group = requireMembership(groupId, currentUser);
        requireAdmin(group, currentUser);

        User newAdmin = group.getMembers().stream()
                .filter(member -> member.getId().equals(newAdminId) && !member.equals(currentUser))
                .findFirst()
                .orElseThrow(InvalidSuccessorException::new);

        group.setCreatedBy(newAdmin);
        taskGroupRepository.save(group);

        return ResponseEntity.ok(maskMembers(group, currentUser));
    }

    // Löscht die Gruppe komplett kaskadierend: erst alle Tasks der Projekte,
    // dann die Projekte, dann die Gruppe selbst. Nur der Admin darf das - die
    // Bestätigung mit den noch aktiven Tasks passiert im Frontend vor diesem
    // Aufruf.
    @Transactional
    public ResponseEntity<Void> deleteGroup(UUID groupId) {
        User currentUser = getCurrentUser();
        TaskGroup group = requireMembership(groupId, currentUser);
        requireAdmin(group, currentUser);

        deleteGroupInternal(group);

        return ResponseEntity.ok().build();
    }

    private void deleteGroupInternal(TaskGroup group) {
        List<Project> projects = projectRepository.findByGroup(group);
        if (!projects.isEmpty()) {
            taskRepository.deleteByProjectIn(projects);
            projectRepository.deleteByGroup(group);
        }

        taskGroupRepository.delete(group);
    }
}
