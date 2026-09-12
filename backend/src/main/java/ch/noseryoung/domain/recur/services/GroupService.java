package ch.noseryoung.domain.recur.services;

import java.security.SecureRandom;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.dto.GroupInvitePreview;
import ch.noseryoung.domain.recur.exceptions.GroupNotFoundException;
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
    private final SecureRandom random = new SecureRandom();

    public GroupService(TaskGroupRepository taskGroupRepository, ProjectRepository projectRepository,
            TaskRepository taskRepository) {
        this.taskGroupRepository = taskGroupRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
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

    public ResponseEntity<TaskGroup> createGroup(TaskGroup group) {
        User currentUser = getCurrentUser();

        TaskGroup newGroup = TaskGroup.builder()
                .name(group.getName())
                .inviteCode(generateUniqueInviteCode())
                .createdBy(currentUser)
                .build();
        newGroup.getMembers().add(currentUser);

        taskGroupRepository.save(newGroup);

        return ResponseEntity.status(201).body(newGroup);
    }

    public ResponseEntity<Collection<TaskGroup>> getMyGroups() {
        List<TaskGroup> groups = taskGroupRepository.findByMembersContaining(getCurrentUser());
        return ResponseEntity.ok(groups);
    }

    public ResponseEntity<TaskGroup> getGroup(UUID id) {
        TaskGroup group = requireMembership(id, getCurrentUser());
        return ResponseEntity.ok(group);
    }

    public ResponseEntity<GroupInvitePreview> previewInvite(String inviteCode) {
        TaskGroup group = taskGroupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new GroupNotFoundException(inviteCode));

        return ResponseEntity.ok(GroupInvitePreview.of(group, getCurrentUser()));
    }

    public ResponseEntity<TaskGroup> joinGroup(String inviteCode) {
        TaskGroup group = taskGroupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new GroupNotFoundException(inviteCode));

        group.getMembers().add(getCurrentUser());
        taskGroupRepository.save(group);

        return ResponseEntity.ok(group);
    }

    // Jedes Mitglied ist gleichberechtigt: Verlassen ist einfach das
    // Entfernen des eigenen Users aus der Mitgliederliste.
    public ResponseEntity<Void> leaveGroup(UUID groupId) {
        removeMember(groupId, getCurrentUser().getId());
        return ResponseEntity.ok().build();
    }

    public ResponseEntity<Void> removeMember(UUID groupId, UUID memberId) {
        User currentUser = getCurrentUser();
        TaskGroup group = requireMembership(groupId, currentUser);

        group.getMembers().removeIf(member -> member.getId().equals(memberId));
        taskGroupRepository.save(group);

        return ResponseEntity.ok().build();
    }

    // Löscht die Gruppe komplett kaskadierend: erst alle Tasks der Projekte,
    // dann die Projekte, dann die Gruppe selbst. Jedes Mitglied darf das (keine
    // Admin-Rolle) - die Bestätigung mit den noch aktiven Tasks passiert im
    // Frontend vor diesem Aufruf.
    @Transactional
    public ResponseEntity<Void> deleteGroup(UUID groupId) {
        TaskGroup group = requireMembership(groupId, getCurrentUser());

        List<Project> projects = projectRepository.findByGroup(group);
        if (!projects.isEmpty()) {
            taskRepository.deleteByProjectIn(projects);
            projectRepository.deleteByGroup(group);
        }

        taskGroupRepository.delete(group);

        return ResponseEntity.ok().build();
    }
}
