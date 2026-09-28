package ch.noseryoung.domain.recur.group.service;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.group.dto.CreateProjectRequest;
import ch.noseryoung.domain.recur.group.event.ProjectsDeletedEvent;
import ch.noseryoung.domain.recur.group.exceptions.GroupNotFoundException;
import ch.noseryoung.domain.recur.group.exceptions.NotGroupAdminException;
import ch.noseryoung.domain.recur.group.exceptions.NotGroupMemberException;
import ch.noseryoung.domain.recur.group.exceptions.ProjectNotArchivedException;
import ch.noseryoung.domain.recur.group.exceptions.ProjectNotFoundException;
import ch.noseryoung.domain.recur.group.model.Project;
import ch.noseryoung.domain.recur.group.model.TaskGroup;
import ch.noseryoung.domain.recur.group.repository.ProjectRepository;
import ch.noseryoung.domain.recur.group.repository.TaskGroupRepository;
import ch.noseryoung.domain.recur.user.service.CurrentUserService;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskGroupRepository taskGroupRepository;
    private final CurrentUserService currentUserService;
    private final ApplicationEventPublisher eventPublisher;

    public ProjectService(ProjectRepository projectRepository, TaskGroupRepository taskGroupRepository,
            CurrentUserService currentUserService, ApplicationEventPublisher eventPublisher) {
        this.projectRepository = projectRepository;
        this.taskGroupRepository = taskGroupRepository;
        this.currentUserService = currentUserService;
        this.eventPublisher = eventPublisher;
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
        TaskGroup group = requireMembership(groupId, currentUserService.get());

        Project newProject = Project.builder()
                .name(request.name())
                .group(group)
                .build();

        projectRepository.save(newProject);

        return ResponseEntity.status(201).body(newProject);
    }

    public ResponseEntity<Collection<Project>> getProjects(UUID groupId) {
        TaskGroup group = requireMembership(groupId, currentUserService.get());
        List<Project> projects = projectRepository.findByGroup(group);

        return ResponseEntity.ok(projects);
    }

    public ResponseEntity<Project> patchProject(UUID groupId, UUID id, Boolean archived) {
        User currentUser = currentUserService.get();
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
        User currentUser = currentUserService.get();
        TaskGroup group = requireMembership(groupId, currentUser);
        requireAdmin(group, currentUser);
        Project project = projectRepository.findByIdAndGroup(id, group)
                .orElseThrow(() -> new ProjectNotFoundException(id));

        if (!Boolean.TRUE.equals(project.getIsArchived())) {
            throw new ProjectNotArchivedException();
        }

        // Muss vor dem Löschen des Projekts passieren (siehe TaskService's
        // @EventListener) - group darf task's Repository nicht direkt aufrufen.
        eventPublisher.publishEvent(new ProjectsDeletedEvent(List.of(project.getId())));
        projectRepository.delete(project);

        return ResponseEntity.ok().build();
    }
}
