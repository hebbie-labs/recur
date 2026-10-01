package ch.noseryoung.domain.recur.group.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;

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
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.service.CurrentUserService;
import ch.noseryoung.domain.recur.user.service.UserVisibilityService;

/**
 * Deckt die zentralen Business-Regeln von GroupService ab: Membership-Checks
 * vor jedem Zugriff, Admin-only Operationen (removeMember, transferAdmin,
 * deleteGroup), die Nachfolger-Pflicht beim Verlassen als Admin
 * (leaveGroup), und die kaskadierende Löschung über ProjectsDeletedEvent.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GroupServiceTest {

    @Mock
    private TaskGroupRepository taskGroupRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private UserVisibilityService visibilityService;

    private GroupService groupService;
    private User currentUser;

    @BeforeEach
    void setUp() {
        groupService = new GroupService(taskGroupRepository, projectRepository, currentUserService, eventPublisher,
                visibilityService);

        currentUser = User.builder().id(UUID.randomUUID()).email("member@example.com").build();
        when(currentUserService.get()).thenReturn(currentUser);

        // toResponse() maskiert nur bei tatsächlich versteckten Profilen - für
        // diese Tests reicht ein Durchreichen ohne Maskierung.
        when(visibilityService.maskIfHidden(any(User.class), any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(visibilityService.maskIfHidden(anyCollection(), any()))
                .thenAnswer(invocation -> new LinkedHashSet<>(invocation.getArgument(0)));
    }

    @Test
    void createGroup_addsCurrentUserAsMemberAndAdmin() {
        when(taskGroupRepository.existsByInviteCode(any())).thenReturn(false);

        ResponseEntity<GroupResponse> response = groupService.createGroup(new CreateGroupRequest("Familie"));

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        var captor = org.mockito.ArgumentCaptor.forClass(TaskGroup.class);
        verify(taskGroupRepository).save(captor.capture());
        assertThat(captor.getValue().getMembers()).containsExactly(currentUser);
        assertThat(captor.getValue().getCreatedBy()).isEqualTo(currentUser);
        assertThat(captor.getValue().getInviteCode()).isNotBlank();
    }

    @Test
    void createGroup_regeneratesInviteCodeOnCollision() {
        when(taskGroupRepository.existsByInviteCode(any())).thenReturn(true, false);

        groupService.createGroup(new CreateGroupRequest("Familie"));

        verify(taskGroupRepository, org.mockito.Mockito.times(2)).existsByInviteCode(any());
    }

    @Test
    void getMyGroups_returnsGroupsForCurrentUser() {
        TaskGroup group = existingGroup();
        when(taskGroupRepository.findByMembersContaining(currentUser)).thenReturn(List.of(group));

        ResponseEntity<java.util.Collection<GroupResponse>> response = groupService.getMyGroups();

        assertThat(response.getBody()).extracting(GroupResponse::id).containsExactly(group.getId());
    }

    @Test
    void getGroup_throwsWhenGroupDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(taskGroupRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.getGroup(id)).isInstanceOf(GroupNotFoundException.class);
    }

    @Test
    void getGroup_throwsWhenCurrentUserIsNotMember() {
        TaskGroup group = existingGroup();
        group.setMembers(new LinkedHashSet<>());
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> groupService.getGroup(group.getId())).isInstanceOf(NotGroupMemberException.class);
    }

    @Test
    void getGroup_returnsGroupWhenCurrentUserIsMember() {
        TaskGroup group = existingGroup();
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        ResponseEntity<GroupResponse> response = groupService.getGroup(group.getId());

        assertThat(response.getBody().id()).isEqualTo(group.getId());
    }

    @Test
    void getProjectsForMyGroups_includesEmptyListForGroupsWithoutProjects() {
        TaskGroup groupWithProject = existingGroup();
        TaskGroup groupWithoutProject = existingGroup();
        Project project = Project.builder().id(UUID.randomUUID()).group(groupWithProject).build();

        when(taskGroupRepository.findByMembersContaining(currentUser))
                .thenReturn(List.of(groupWithProject, groupWithoutProject));
        when(projectRepository.findByGroupIn(List.of(groupWithProject, groupWithoutProject)))
                .thenReturn(List.of(project));

        ResponseEntity<java.util.Map<UUID, List<Project>>> response = groupService.getProjectsForMyGroups();

        assertThat(response.getBody().get(groupWithProject.getId())).containsExactly(project);
        assertThat(response.getBody().get(groupWithoutProject.getId())).isEmpty();
    }

    @Test
    void previewInvite_throwsWhenInviteCodeUnknown() {
        when(taskGroupRepository.findByInviteCode("UNKNOWN")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.previewInvite("UNKNOWN")).isInstanceOf(GroupNotFoundException.class);
    }

    @Test
    void previewInvite_reflectsWhetherCurrentUserIsAlreadyMember() {
        TaskGroup group = existingGroup();
        when(taskGroupRepository.findByInviteCode(group.getInviteCode())).thenReturn(Optional.of(group));

        GroupInvitePreview preview = groupService.previewInvite(group.getInviteCode()).getBody();

        assertThat(preview.alreadyMember()).isTrue();
        assertThat(preview.memberCount()).isEqualTo(1);
    }

    @Test
    void joinGroup_addsCurrentUserToMembers() {
        TaskGroup group = existingGroup();
        group.setMembers(new LinkedHashSet<>());
        when(taskGroupRepository.findByInviteCode(group.getInviteCode())).thenReturn(Optional.of(group));

        groupService.joinGroup(group.getInviteCode());

        assertThat(group.getMembers()).containsExactly(currentUser);
        verify(taskGroupRepository).save(group);
    }

    @Test
    void leaveGroup_regularMemberSimplyLeaves() {
        User admin = User.builder().id(UUID.randomUUID()).build();
        TaskGroup group = existingGroup();
        group.setCreatedBy(admin);
        group.setMembers(new LinkedHashSet<>(Set.of(currentUser, admin)));
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        groupService.leaveGroup(group.getId(), null);

        assertThat(group.getMembers()).containsExactly(admin);
        verify(taskGroupRepository, never()).delete(any());
    }

    @Test
    void leaveGroup_lastMemberDeletesGroupEntirely() {
        TaskGroup group = existingGroup();
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(projectRepository.findByGroup(group)).thenReturn(List.of());

        groupService.leaveGroup(group.getId(), null);

        verify(taskGroupRepository).delete(group);
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void leaveGroup_adminWithOtherMembersRequiresSuccessor() {
        User other = User.builder().id(UUID.randomUUID()).build();
        TaskGroup group = existingGroup();
        group.setMembers(new LinkedHashSet<>(Set.of(currentUser, other)));
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> groupService.leaveGroup(group.getId(), null))
                .isInstanceOf(AdminSuccessorRequiredException.class);
    }

    @Test
    void leaveGroup_adminWithInvalidSuccessorThrows() {
        User other = User.builder().id(UUID.randomUUID()).build();
        TaskGroup group = existingGroup();
        group.setMembers(new LinkedHashSet<>(Set.of(currentUser, other)));
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> groupService.leaveGroup(group.getId(), UUID.randomUUID()))
                .isInstanceOf(InvalidSuccessorException.class);
    }

    @Test
    void leaveGroup_adminTransfersAdminToSuccessorThenLeaves() {
        User successor = User.builder().id(UUID.randomUUID()).build();
        TaskGroup group = existingGroup();
        group.setMembers(new LinkedHashSet<>(Set.of(currentUser, successor)));
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        groupService.leaveGroup(group.getId(), successor.getId());

        assertThat(group.getCreatedBy()).isEqualTo(successor);
        assertThat(group.getMembers()).containsExactly(successor);
    }

    @Test
    void removeMember_nonAdminThrows() {
        User admin = User.builder().id(UUID.randomUUID()).build();
        TaskGroup group = existingGroup();
        group.setCreatedBy(admin);
        group.setMembers(new LinkedHashSet<>(Set.of(currentUser, admin)));
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> groupService.removeMember(group.getId(), admin.getId()))
                .isInstanceOf(NotGroupAdminException.class);
    }

    @Test
    void removeMember_cannotRemoveTheAdminItself() {
        TaskGroup group = existingGroup();
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> groupService.removeMember(group.getId(), currentUser.getId()))
                .isInstanceOf(CannotRemoveAdminException.class);
    }

    @Test
    void removeMember_adminRemovesRegularMember() {
        User member = User.builder().id(UUID.randomUUID()).build();
        TaskGroup group = existingGroup();
        group.setMembers(new LinkedHashSet<>(Set.of(currentUser, member)));
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        groupService.removeMember(group.getId(), member.getId());

        assertThat(group.getMembers()).containsExactly(currentUser);
        verify(taskGroupRepository).save(group);
    }

    @Test
    void transferAdmin_nonAdminThrows() {
        User admin = User.builder().id(UUID.randomUUID()).build();
        User other = User.builder().id(UUID.randomUUID()).build();
        TaskGroup group = existingGroup();
        group.setCreatedBy(admin);
        group.setMembers(new LinkedHashSet<>(Set.of(currentUser, admin, other)));
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> groupService.transferAdmin(group.getId(), other.getId()))
                .isInstanceOf(NotGroupAdminException.class);
    }

    @Test
    void transferAdmin_targetMustBeAnExistingOtherMember() {
        TaskGroup group = existingGroup();
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> groupService.transferAdmin(group.getId(), UUID.randomUUID()))
                .isInstanceOf(InvalidSuccessorException.class);
    }

    @Test
    void transferAdmin_setsNewAdminWithoutRemovingCurrentUser() {
        User newAdmin = User.builder().id(UUID.randomUUID()).build();
        TaskGroup group = existingGroup();
        group.setMembers(new LinkedHashSet<>(Set.of(currentUser, newAdmin)));
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        groupService.transferAdmin(group.getId(), newAdmin.getId());

        assertThat(group.getCreatedBy()).isEqualTo(newAdmin);
        assertThat(group.getMembers()).contains(currentUser, newAdmin);
    }

    @Test
    void deleteGroup_nonAdminThrows() {
        User admin = User.builder().id(UUID.randomUUID()).build();
        TaskGroup group = existingGroup();
        group.setCreatedBy(admin);
        group.setMembers(new LinkedHashSet<>(Set.of(currentUser, admin)));
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> groupService.deleteGroup(group.getId())).isInstanceOf(NotGroupAdminException.class);
    }

    @Test
    void deleteGroup_publishesProjectsDeletedEventBeforeDeletingProjectsThenGroup() {
        TaskGroup group = existingGroup();
        Project project = Project.builder().id(UUID.randomUUID()).group(group).build();
        when(taskGroupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(projectRepository.findByGroup(group)).thenReturn(List.of(project));

        groupService.deleteGroup(group.getId());

        var eventCaptor = org.mockito.ArgumentCaptor.forClass(ProjectsDeletedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().projectIds()).containsExactly(project.getId());
        verify(projectRepository).deleteByGroup(group);
        verify(taskGroupRepository).delete(group);
    }

    @Test
    void requireProjectForMember_throwsWhenProjectNotFound() {
        UUID projectId = UUID.randomUUID();
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.requireProjectForMember(projectId, currentUser))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void requireProjectForMember_throwsWhenCurrentUserNotInProjectsGroup() {
        TaskGroup group = existingGroup();
        group.setMembers(new LinkedHashSet<>());
        Project project = Project.builder().id(UUID.randomUUID()).group(group).build();
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> groupService.requireProjectForMember(project.getId(), currentUser))
                .isInstanceOf(NotGroupMemberException.class);
    }

    @Test
    void requireProjectForMember_returnsProjectWhenCurrentUserIsMember() {
        TaskGroup group = existingGroup();
        Project project = Project.builder().id(UUID.randomUUID()).group(group).build();
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));

        Project result = groupService.requireProjectForMember(project.getId(), currentUser);

        assertThat(result).isEqualTo(project);
    }

    private TaskGroup existingGroup() {
        return TaskGroup.builder()
                .id(UUID.randomUUID())
                .name("Bestehende Gruppe")
                .inviteCode("ABCD1234")
                .createdBy(currentUser)
                .members(new LinkedHashSet<>(Set.of(currentUser)))
                .build();
    }
}
