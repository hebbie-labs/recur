package ch.noseryoung.domain.recur.services;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.dto.CreateProjectRequest;
import ch.noseryoung.domain.recur.exceptions.GroupNotFoundException;
import ch.noseryoung.domain.recur.exceptions.NotGroupAdminException;
import ch.noseryoung.domain.recur.exceptions.NotGroupMemberException;
import ch.noseryoung.domain.recur.exceptions.ProjectNotArchivedException;
import ch.noseryoung.domain.recur.exceptions.ProjectNotFoundException;
import ch.noseryoung.domain.recur.models.Project;
import ch.noseryoung.domain.recur.models.TaskGroup;
import ch.noseryoung.domain.recur.models.User;
import ch.noseryoung.domain.recur.repositories.ProjectRepository;
import ch.noseryoung.domain.recur.repositories.TaskGroupRepository;
import ch.noseryoung.domain.recur.repositories.TaskRepository;
import ch.noseryoung.domain.recur.security.CustomUserDetails;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskGroupRepository taskGroupRepository;
    private final TaskRepository taskRepository;

    public ProjectService(ProjectRepository projectRepository, TaskGroupRepository taskGroupRepository,
            TaskRepository taskRepository) {
        this.projectRepository = projectRepository;
        this.taskGroupRepository = taskGroupRepository;
        this.taskRepository = taskRepository;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalStateException("Kein authentifizierter User im SecurityContext gefunden");
        }

        return userDetails.getUser();
    }

    private TaskGroup requireMembership(UUID groupId, User user) {
        TaskGroup group = taskGroupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException(groupId));

        if (!group.getMembers().contains(user)) {
            throw new NotGroupMemberException();
        }

        return group;
    }

    private void requireAdmin(TaskGroup group, User user) {
        if (group.getCreatedBy() == null || !group.getCreatedBy().equals(user)) {
            throw new NotGroupAdminException();
        }
    }

    public ResponseEntity<Project> createProject(UUID groupId, CreateProjectRequest request) {
        TaskGroup group = requireMembership(groupId, getCurrentUser());

        Project newProject = Project.builder()
                .name(request.name())
                .group(group)
                .build();

        projectRepository.save(newProject);

        return ResponseEntity.status(201).body(newProject);
    }

    public ResponseEntity<Collection<Project>> getProjects(UUID groupId) {
        TaskGroup group = requireMembership(groupId, getCurrentUser());
        List<Project> projects = projectRepository.findByGroup(group);

        return ResponseEntity.ok(projects);
    }

    public ResponseEntity<Project> patchProject(UUID groupId, UUID id, Boolean archived) {
        User currentUser = getCurrentUser();
        TaskGroup group = requireMembership(groupId, currentUser);
        requireAdmin(group, currentUser);
        Project project = projectRepository.findByIdAndGroup(id, group)
                .orElseThrow(() -> new ProjectNotFoundException(id));

        if (archived != null) {
            project.setIsArchived(archived);
        }

        projectRepository.save(project);

        return ResponseEntity.ok(project);
    }

    // Gleiche Regel wie bei Tasks: erst archivieren, dann löschen. Löscht beim
    // Löschen des Projekts auch dessen Tasks mit, die Gruppe selbst bleibt
    // unberührt.
    @Transactional
    public ResponseEntity<Void> deleteProject(UUID groupId, UUID id) {
        User currentUser = getCurrentUser();
        TaskGroup group = requireMembership(groupId, currentUser);
        requireAdmin(group, currentUser);
        Project project = projectRepository.findByIdAndGroup(id, group)
                .orElseThrow(() -> new ProjectNotFoundException(id));

        if (!Boolean.TRUE.equals(project.getIsArchived())) {
            throw new ProjectNotArchivedException();
        }

        taskRepository.deleteByProjectIn(List.of(project));
        projectRepository.delete(project);

        return ResponseEntity.ok().build();
    }
}
