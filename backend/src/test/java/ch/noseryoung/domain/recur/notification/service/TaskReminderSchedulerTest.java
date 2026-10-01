package ch.noseryoung.domain.recur.notification.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
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

import ch.noseryoung.domain.recur.group.model.Project;
import ch.noseryoung.domain.recur.group.model.TaskGroup;
import ch.noseryoung.domain.recur.notification.enums.NotificationType;
import ch.noseryoung.domain.recur.notification.model.NotificationSettings;
import ch.noseryoung.domain.recur.notification.repository.NotificationLogRepository;
import ch.noseryoung.domain.recur.notification.repository.NotificationSettingsRepository;
import ch.noseryoung.domain.recur.task.enums.Category;
import ch.noseryoung.domain.recur.task.enums.Frequency;
import ch.noseryoung.domain.recur.task.enums.ReminderLeadTime;
import ch.noseryoung.domain.recur.task.model.Task;
import ch.noseryoung.domain.recur.task.service.TaskService;
import ch.noseryoung.domain.recur.user.model.User;

/**
 * Deckt #102 (Erinnerung/Überfällig) ab, wie in CLAUDE.md dokumentiert:
 * TaskReminderScheduler löst die tatsächliche Vorlaufzeit pro (task,
 * recipient) als TaskReminderOverride -> NotificationSettings.reminderLeadTime
 * -> hardcoded 24h auf, dedupliziert per NotificationLog (ein Eintrag pro
 * task/recipient/type), und bestimmt die Empfänger persönlicher vs.
 * Projekt-Tasks unterschiedlich (owner vs. zugewiesene/alle Gruppenmitglieder
 * abzüglich wer bereits archiviert hat).
 */
@ExtendWith(MockitoExtension.class)
class TaskReminderSchedulerTest {

    @Mock
    private TaskService taskService;

    @Mock
    private NotificationSettingsRepository notificationSettingsRepository;

    @Mock
    private NotificationLogRepository notificationLogRepository;

    @Mock
    private NotificationDispatchService notificationDispatchService;

    private TaskReminderScheduler scheduler;
    private User owner;

    @BeforeEach
    void setUp() {
        scheduler = new TaskReminderScheduler(taskService, notificationSettingsRepository, notificationLogRepository,
                notificationDispatchService);

        owner = User.builder().id(UUID.randomUUID()).email("owner@example.com").build();
        lenient().when(taskService.reminderLeadTimeOverride(any(), any())).thenReturn(Optional.empty());
    }

    private Task personalTask(Instant dateUntil, Instant startTime) {
        return Task.builder()
                .id(UUID.randomUUID())
                .name("Task")
                .category(Category.WORK)
                .frequency(Frequency.ONCE)
                .owner(owner)
                .dateUntil(dateUntil)
                .startTime(startTime)
                .build();
    }

    @Test
    void checkDueTasks_sendsReminderOncePastAccountLeadTimeAndLogsIt() {
        Task task = personalTask(Instant.now().plus(1, ChronoUnit.HOURS), null);
        when(taskService.findDueTasks()).thenReturn(List.of(task));
        when(notificationSettingsRepository.findByUserId(owner.getId()))
                .thenReturn(Optional.of(NotificationSettings.builder().reminderLeadTime(ReminderLeadTime.SIX_HOURS).build()));
        when(notificationLogRepository.existsByTaskAndRecipientAndType(task, owner, NotificationType.REMINDER))
                .thenReturn(false);

        scheduler.checkDueTasks();

        verify(notificationDispatchService).sendReminder(owner, task);
        verify(notificationLogRepository).save(argThat(log -> log.getType() == NotificationType.REMINDER
                && log.getTask().equals(task) && log.getRecipient().equals(owner)));
    }

    @Test
    void checkDueTasks_skipsReminderWhenStillBeforeLeadTimeWindow() {
        // Kein Override, keine Account-Settings -> 24h-Default. Bei 30h bis
        // Fälligkeit liegt die Erinnerungsschwelle (dateUntil - 24h) noch 6h
        // in der Zukunft, es darf also noch nichts verschickt werden.
        Task task = personalTask(Instant.now().plus(30, ChronoUnit.HOURS), null);
        when(taskService.findDueTasks()).thenReturn(List.of(task));
        when(notificationSettingsRepository.findByUserId(owner.getId())).thenReturn(Optional.empty());
        when(notificationLogRepository.existsByTaskAndRecipientAndType(any(), any(), any())).thenReturn(false);

        scheduler.checkDueTasks();

        verify(notificationDispatchService, never()).sendReminder(any(), any());
    }

    @Test
    void checkDueTasks_defaultsToTwentyFourHoursWhenNoOverrideAndNoAccountSettings() {
        // 24h ist der harte Default (siehe CLAUDE.md) - genau an der Grenze
        // (25h vor Fälligkeit) darf noch keine Erinnerung rausgehen.
        Task task = personalTask(Instant.now().plus(25, ChronoUnit.HOURS), null);
        when(taskService.findDueTasks()).thenReturn(List.of(task));
        when(notificationSettingsRepository.findByUserId(owner.getId())).thenReturn(Optional.empty());
        when(notificationLogRepository.existsByTaskAndRecipientAndType(any(), any(), any())).thenReturn(false);

        scheduler.checkDueTasks();

        verify(notificationDispatchService, never()).sendReminder(any(), any());
    }

    @Test
    void checkDueTasks_taskReminderOverrideTakesPrecedenceOverAccountSettings() {
        Task task = personalTask(Instant.now().plus(30, ChronoUnit.MINUTES), null);
        when(taskService.findDueTasks()).thenReturn(List.of(task));
        when(taskService.reminderLeadTimeOverride(task, owner)).thenReturn(Optional.of(ReminderLeadTime.ONE_HOUR));
        when(notificationLogRepository.existsByTaskAndRecipientAndType(any(), any(), any())).thenReturn(false);

        scheduler.checkDueTasks();

        verify(notificationDispatchService).sendReminder(owner, task);
        // Account-Settings dürfen dann gar nicht mehr abgefragt werden müssen -
        // die Override-Duration allein entscheidet.
        verify(notificationSettingsRepository, never()).findByUserId(any());
    }

    @Test
    void checkDueTasks_doesNotResendReminderAlreadyLogged() {
        Task task = personalTask(Instant.now().minus(1, ChronoUnit.HOURS), null);
        when(taskService.findDueTasks()).thenReturn(List.of(task));
        when(notificationLogRepository.existsByTaskAndRecipientAndType(task, owner, NotificationType.REMINDER))
                .thenReturn(true);
        when(notificationLogRepository.existsByTaskAndRecipientAndType(task, owner, NotificationType.OVERDUE))
                .thenReturn(true);

        scheduler.checkDueTasks();

        verify(notificationDispatchService, never()).sendReminder(any(), any());
        verify(notificationLogRepository, never()).save(any());
    }

    @Test
    void checkDueTasks_timedTaskIsOverdueOneHourAfterDateUntil() {
        Task task = personalTask(Instant.now().minus(30, ChronoUnit.MINUTES), Instant.now().minus(2, ChronoUnit.HOURS));
        when(taskService.findDueTasks()).thenReturn(List.of(task));
        when(notificationLogRepository.existsByTaskAndRecipientAndType(any(), any(), any())).thenReturn(true);
        when(notificationLogRepository.existsByTaskAndRecipientAndType(task, owner, NotificationType.OVERDUE))
                .thenReturn(false);

        scheduler.checkDueTasks();

        verify(notificationDispatchService, never()).sendOverdue(owner, task);
    }

    @Test
    void checkDueTasks_timedTaskBecomesOverdueAfterOneHour() {
        Task task = personalTask(Instant.now().minus(2, ChronoUnit.HOURS), Instant.now().minus(3, ChronoUnit.HOURS));
        when(taskService.findDueTasks()).thenReturn(List.of(task));
        when(notificationLogRepository.existsByTaskAndRecipientAndType(any(), any(), any())).thenReturn(true);
        when(notificationLogRepository.existsByTaskAndRecipientAndType(task, owner, NotificationType.OVERDUE))
                .thenReturn(false);

        scheduler.checkDueTasks();

        verify(notificationDispatchService).sendOverdue(owner, task);
        verify(notificationLogRepository).save(argThat(log -> log.getType() == NotificationType.OVERDUE));
    }

    @Test
    void checkDueTasks_allDayTaskOnlyBecomesOverdueAfterOneDay() {
        Task task = personalTask(Instant.now().minus(2, ChronoUnit.HOURS), null);
        when(taskService.findDueTasks()).thenReturn(List.of(task));
        when(notificationLogRepository.existsByTaskAndRecipientAndType(any(), any(), any())).thenReturn(true);
        when(notificationLogRepository.existsByTaskAndRecipientAndType(task, owner, NotificationType.OVERDUE))
                .thenReturn(false);

        scheduler.checkDueTasks();

        verify(notificationDispatchService, never()).sendOverdue(owner, task);
    }

    @Test
    void checkDueTasks_personalTaskOnlyNotifiesOwner() {
        Task task = personalTask(Instant.now().minus(1, ChronoUnit.HOURS), null);
        when(taskService.findDueTasks()).thenReturn(List.of(task));
        when(notificationLogRepository.existsByTaskAndRecipientAndType(any(), any(), any())).thenReturn(true);

        scheduler.checkDueTasks();

        verify(notificationDispatchService, never()).sendReminder(any(), any());
        verify(notificationDispatchService, never()).sendOverdue(any(), any());
    }

    @Test
    void checkDueTasks_projectTaskWithoutAssigneesNotifiesAllGroupMembers() {
        User memberA = User.builder().id(UUID.randomUUID()).build();
        User memberB = User.builder().id(UUID.randomUUID()).build();
        TaskGroup group = TaskGroup.builder().id(UUID.randomUUID())
                .members(new LinkedHashSet<>(Set.of(memberA, memberB))).build();
        Project project = Project.builder().id(UUID.randomUUID()).group(group).build();
        Task task = Task.builder()
                .id(UUID.randomUUID())
                .name("Projekt-Task")
                .category(Category.WORK)
                .frequency(Frequency.ONCE)
                .project(project)
                .dateUntil(Instant.now().minus(2, ChronoUnit.DAYS))
                .build();
        when(taskService.findDueTasks()).thenReturn(List.of(task));
        when(notificationLogRepository.existsByTaskAndRecipientAndType(any(), any(), any())).thenReturn(true);

        scheduler.checkDueTasks();

        verify(notificationLogRepository, times(2)).existsByTaskAndRecipientAndType(eq(task), any(), eq(NotificationType.REMINDER));
    }

    @Test
    void checkDueTasks_projectTaskWithAssigneesOnlyNotifiesThem() {
        User assignee = User.builder().id(UUID.randomUUID()).build();
        User groupOnlyMember = User.builder().id(UUID.randomUUID()).build();
        TaskGroup group = TaskGroup.builder().id(UUID.randomUUID())
                .members(new LinkedHashSet<>(Set.of(assignee, groupOnlyMember))).build();
        Project project = Project.builder().id(UUID.randomUUID()).group(group).build();
        Task task = Task.builder()
                .id(UUID.randomUUID())
                .name("Projekt-Task")
                .category(Category.WORK)
                .frequency(Frequency.ONCE)
                .project(project)
                .assignedMembers(new LinkedHashSet<>(Set.of(assignee)))
                .dateUntil(Instant.now().minus(2, ChronoUnit.DAYS))
                .build();
        when(taskService.findDueTasks()).thenReturn(List.of(task));
        when(notificationLogRepository.existsByTaskAndRecipientAndType(eq(task), eq(assignee), any())).thenReturn(true);

        scheduler.checkDueTasks();

        verify(notificationLogRepository, never())
                .existsByTaskAndRecipientAndType(eq(task), eq(groupOnlyMember), any());
    }

    @Test
    void checkDueTasks_excludesMembersWhoAlreadyArchivedTheirCopy() {
        User activeMember = User.builder().id(UUID.randomUUID()).build();
        User archivedMember = User.builder().id(UUID.randomUUID()).build();
        TaskGroup group = TaskGroup.builder().id(UUID.randomUUID())
                .members(new LinkedHashSet<>(Set.of(activeMember, archivedMember))).build();
        Project project = Project.builder().id(UUID.randomUUID()).group(group).build();
        Task task = Task.builder()
                .id(UUID.randomUUID())
                .name("Projekt-Task")
                .category(Category.WORK)
                .frequency(Frequency.ONCE)
                .project(project)
                .archivedBy(new LinkedHashSet<>(Set.of(archivedMember)))
                .dateUntil(Instant.now().minus(2, ChronoUnit.DAYS))
                .build();
        when(taskService.findDueTasks()).thenReturn(List.of(task));
        when(notificationLogRepository.existsByTaskAndRecipientAndType(any(), any(), any())).thenReturn(true);

        scheduler.checkDueTasks();

        verify(notificationLogRepository, never())
                .existsByTaskAndRecipientAndType(eq(task), eq(archivedMember), any());
    }

    private static ch.noseryoung.domain.recur.notification.model.NotificationLog argThat(
            java.util.function.Predicate<ch.noseryoung.domain.recur.notification.model.NotificationLog> predicate) {
        return org.mockito.ArgumentMatchers.argThat(predicate::test);
    }
}
