package ch.noseryoung.domain.recur.notification.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import ch.noseryoung.domain.recur.notification.model.NotificationSettings;
import ch.noseryoung.domain.recur.notification.repository.NotificationLogRepository;
import ch.noseryoung.domain.recur.notification.repository.NotificationSettingsRepository;
import ch.noseryoung.domain.recur.shared.service.EmailService;
import ch.noseryoung.domain.recur.task.enums.Category;
import ch.noseryoung.domain.recur.task.enums.Frequency;
import ch.noseryoung.domain.recur.task.event.ProjectTaskCreatedEvent;
import ch.noseryoung.domain.recur.task.event.TasksDeletedEvent;
import ch.noseryoung.domain.recur.task.model.Task;
import ch.noseryoung.domain.recur.user.model.User;

/**
 * Deckt die Empfänger-Toggle-Logik von NotificationDispatchService ab
 * (CLAUDE.md, bekanntes dpdns.org-Problem #126): der globale
 * app.notifications.email-enabled-Kill-Switch muss zusätzlich zum
 * Nutzer-Toggle emailEnabled greifen, während Push davon unberührt bleibt.
 * Fehlende NotificationSettings werden hier bewusst NICHT persistiert (anders
 * als NotificationSettingsService), da ein Scheduler-Lauf über alle User
 * nicht bei jedem Durchlauf Zeilen anlegen soll.
 */
@ExtendWith(MockitoExtension.class)
class NotificationDispatchServiceTest {

    @Mock
    private NotificationSettingsRepository notificationSettingsRepository;

    @Mock
    private NotificationLogRepository notificationLogRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private PushNotificationService pushNotificationService;

    private NotificationDispatchService notificationDispatchService;
    private User recipient;
    private Task task;

    @BeforeEach
    void setUp() {
        notificationDispatchService = new NotificationDispatchService(notificationSettingsRepository,
                notificationLogRepository, emailService, pushNotificationService);

        recipient = User.builder().id(UUID.randomUUID()).email("recipient@example.com").firstName("Rita").build();
        task = Task.builder().id(UUID.randomUUID()).name("Wäsche").category(Category.PERSONAL)
                .frequency(Frequency.ONCE).owner(recipient).build();
    }

    private void enableGlobalEmailKillSwitch(boolean enabled) {
        ReflectionTestUtils.setField(notificationDispatchService, "emailNotificationsEnabled", enabled);
    }

    @Test
    void sendReminder_skipsEmailWhenGlobalKillSwitchIsOffEvenIfUserEnabledIt() {
        enableGlobalEmailKillSwitch(false);
        when(notificationSettingsRepository.findByUserId(recipient.getId()))
                .thenReturn(Optional.of(settingsWith(true, true)));

        notificationDispatchService.sendReminder(recipient, task);

        verify(emailService, never()).send(anyString(), anyString(), anyString());
        verify(pushNotificationService).sendToUser(any(), anyString(), anyString());
    }

    @Test
    void sendReminder_sendsEmailWhenGlobalSwitchOnAndUserOptedIn() {
        enableGlobalEmailKillSwitch(true);
        when(notificationSettingsRepository.findByUserId(recipient.getId()))
                .thenReturn(Optional.of(settingsWith(true, false)));

        notificationDispatchService.sendReminder(recipient, task);

        verify(emailService).send(eq(recipient.getEmail()), anyString(), anyString());
        verify(pushNotificationService, never()).sendToUser(any(), anyString(), anyString());
    }

    @Test
    void sendReminder_skipsEmailWhenUserOptedOutEvenIfGlobalSwitchOn() {
        enableGlobalEmailKillSwitch(true);
        when(notificationSettingsRepository.findByUserId(recipient.getId()))
                .thenReturn(Optional.of(settingsWith(false, true)));

        notificationDispatchService.sendReminder(recipient, task);

        verify(emailService, never()).send(anyString(), anyString(), anyString());
    }

    @Test
    void sendReminder_fallsBackToInMemoryDefaultsWithoutPersistingWhenNoSettingsRowExists() {
        enableGlobalEmailKillSwitch(true);
        when(notificationSettingsRepository.findByUserId(recipient.getId())).thenReturn(Optional.empty());

        notificationDispatchService.sendReminder(recipient, task);

        verify(notificationSettingsRepository, never()).save(any());
        verify(emailService).send(eq(recipient.getEmail()), anyString(), anyString());
        verify(pushNotificationService).sendToUser(any(), anyString(), anyString());
    }

    @Test
    void sendOverdue_respectsSameToggleRulesAsReminder() {
        enableGlobalEmailKillSwitch(false);
        when(notificationSettingsRepository.findByUserId(recipient.getId()))
                .thenReturn(Optional.of(settingsWith(true, true)));

        notificationDispatchService.sendOverdue(recipient, task);

        verify(emailService, never()).send(anyString(), anyString(), anyString());
        verify(pushNotificationService).sendToUser(any(), anyString(), anyString());
    }

    @Test
    void onProjectTaskCreated_notifiesEachRecipientExceptTheCreator() {
        enableGlobalEmailKillSwitch(true);
        User other = User.builder().id(UUID.randomUUID()).email("other@example.com").firstName("Otto").build();
        when(notificationSettingsRepository.findByUserId(any())).thenReturn(Optional.of(settingsWith(true, true)));

        notificationDispatchService.onProjectTaskCreated(
                new ProjectTaskCreatedEvent(task, recipient, java.util.List.of(other)));

        verify(emailService).send(eq(other.getEmail()), anyString(), anyString());
        verify(pushNotificationService).sendToUser(eq(other), anyString(), anyString());
    }

    @Test
    void onTasksDeleted_deletesNotificationLogsForThoseTaskIds() {
        notificationDispatchService.onTasksDeleted(new TasksDeletedEvent(java.util.List.of(task.getId())));

        verify(notificationLogRepository).deleteByTaskIdIn(java.util.List.of(task.getId()));
    }

    private NotificationSettings settingsWith(boolean emailEnabled, boolean pushEnabled) {
        return NotificationSettings.builder()
                .id(UUID.randomUUID())
                .user(recipient)
                .emailEnabled(emailEnabled)
                .pushEnabled(pushEnabled)
                .build();
    }
}
