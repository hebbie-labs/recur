package ch.noseryoung.domain.recur.group.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;

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
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.service.CurrentUserService;

/**
 * Deckt die zentralen Business-Regeln von ProjectService ab: Membership vor
 * jedem Zugriff, Admin-only für patch/delete, "erst archivieren, dann
 * löschen" (analog zu Task), und dass deleteProject vor dem eigentlichen
 * Löschen ein ProjectsDeletedEvent publiziert, damit TaskService die
 * zugehörigen Tasks aufräumen kann.
 */
@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private TaskGroupRepository taskGroupRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private ProjectService projectService;
    private User admin;

    @BeforeEach
    void setUp() {
        projectService = new ProjectService(projectRepository, taskGroupRepository, currentUserService, eventPublisher);

        admin = User.builder().id(UUID.randomUUID()).email("admin@example.com").build();
        when(currentUserService.get()).thenReturn(admin);
    }

    @Test
    void createProject_throwsWhenGroupDoesNotExist() {
        UUID groupId = UUID.randomUUID();
        when(taskGroupRepository.findById(groupId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.createProject(groupId, new CreateProjectRequest("Neu")))
                .isInstanceOf(GroupNotFoundException.class);
    }

    @Test
    void createProject_throwsWhenCurrentUserIsNotMember() {
        TaskGroup group = adminGroup();
        group.setMembers(new LinkedHashSet<>());
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> projectService.createProject(group.getId(), new CreateProjectRequest("Neu")))
                .isInstanceOf(NotGroupMemberException.class);
    }

    @Test
    void createProject_createsProjectInGroupWhenMember() {
        TaskGroup group = adminGroup();
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        ResponseEntity<Project> response = projectService.createProject(group.getId(), new CreateProjectRequest("Neu"));

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        var captor = org.mockito.ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Neu");
        assertThat(captor.getValue().getGroup()).isEqualTo(group);
    }

    @Test
    void getProjects_returnsProjectsOfGroupWhenMember() {
        TaskGroup group = adminGroup();
        Project project = Project.builder().id(UUID.randomUUID()).group(group).build();
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(projectRepository.findByGroup(group)).thenReturn(List.of(project));

        ResponseEntity<java.util.Collection<Project>> response = projectService.getProjects(group.getId());

        assertThat(response.getBody()).containsExactly(project);
    }

    @Test
    void getProjects_throwsWhenCurrentUserIsNotMember() {
        TaskGroup group = adminGroup();
        group.setMembers(new LinkedHashSet<>());
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> projectService.getProjects(group.getId())).isInstanceOf(NotGroupMemberException.class);
    }

    @Test
    void patchProject_nonAdminMemberThrows() {
        User member = User.builder().id(UUID.randomUUID()).build();
        when(currentUserService.get()).thenReturn(member);
        TaskGroup group = adminGroup();
        group.setMembers(new LinkedHashSet<>(Set.of(admin, member)));
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> projectService.patchProject(group.getId(), UUID.randomUUID(), true))
                .isInstanceOf(NotGroupAdminException.class);
    }

    @Test
    void patchProject_throwsWhenProjectNotFoundInGroup() {
        TaskGroup group = adminGroup();
        UUID projectId = UUID.randomUUID();
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(projectRepository.findByIdAndGroup(projectId, group)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.patchProject(group.getId(), projectId, true))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void patchProject_updatesArchivedFlagWhenAdmin() {
        TaskGroup group = adminGroup();
        Project project = Project.builder().id(UUID.randomUUID()).group(group).isArchived(false).build();
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(projectRepository.findByIdAndGroup(project.getId(), group)).thenReturn(Optional.of(project));

        ResponseEntity<Project> response = projectService.patchProject(group.getId(), project.getId(), true);

        assertThat(response.getBody().getIsArchived()).isTrue();
        verify(projectRepository).save(project);
    }

    @Test
    void patchProject_leavesArchivedFlagUntouchedWhenNull() {
        TaskGroup group = adminGroup();
        Project project = Project.builder().id(UUID.randomUUID()).group(group).isArchived(true).build();
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(projectRepository.findByIdAndGroup(project.getId(), group)).thenReturn(Optional.of(project));

        projectService.patchProject(group.getId(), project.getId(), null);

        assertThat(project.getIsArchived()).isTrue();
    }

    @Test
    void deleteProject_nonAdminMemberThrows() {
        User member = User.builder().id(UUID.randomUUID()).build();
        when(currentUserService.get()).thenReturn(member);
        TaskGroup group = adminGroup();
        group.setMembers(new LinkedHashSet<>(Set.of(admin, member)));
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> projectService.deleteProject(group.getId(), UUID.randomUUID()))
                .isInstanceOf(NotGroupAdminException.class);
    }

    @Test
    void deleteProject_rejectsDeletionOfNonArchivedProject() {
        TaskGroup group = adminGroup();
        Project project = Project.builder().id(UUID.randomUUID()).group(group).isArchived(false).build();
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(projectRepository.findByIdAndGroup(project.getId(), group)).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> projectService.deleteProject(group.getId(), project.getId()))
                .isInstanceOf(ProjectNotArchivedException.class);
        verify(eventPublisher, never()).publishEvent(any());
        verify(projectRepository, never()).delete(any());
    }

    @Test
    void deleteProject_publishesEventBeforeDeletingArchivedProject() {
        TaskGroup group = adminGroup();
        Project project = Project.builder().id(UUID.randomUUID()).group(group).isArchived(true).build();
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(projectRepository.findByIdAndGroup(project.getId(), group)).thenReturn(Optional.of(project));

        projectService.deleteProject(group.getId(), project.getId());

        var eventCaptor = org.mockito.ArgumentCaptor.forClass(ProjectsDeletedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().projectIds()).containsExactly(project.getId());
        verify(projectRepository).delete(project);
    }

    private TaskGroup adminGroup() {
        return TaskGroup.builder()
                .id(UUID.randomUUID())
                .name("Gruppe")
                .inviteCode("ABCD1234")
                .createdBy(admin)
                .members(new LinkedHashSet<>(Set.of(admin)))
                .build();
    }
}
