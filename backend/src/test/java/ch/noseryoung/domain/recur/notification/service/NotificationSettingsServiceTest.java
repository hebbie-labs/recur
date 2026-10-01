package ch.noseryoung.domain.recur.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ch.noseryoung.domain.recur.notification.dto.NotificationSettingsResponse;
import ch.noseryoung.domain.recur.notification.model.NotificationSettings;
import ch.noseryoung.domain.recur.notification.repository.NotificationSettingsRepository;
import ch.noseryoung.domain.recur.task.enums.ReminderLeadTime;
import ch.noseryoung.domain.recur.user.event.UserDeletedEvent;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.service.CurrentUserService;

/**
 * Deckt die zentralen Regeln von NotificationSettingsService ab: lazy
 * Anlage der Settings-Zeile mit Default-Werten für Bestandsnutzer,
 * PATCH-Semantik (null = nicht ändern, analog zu Task.OnCreate), und das
 * synchrone Aufräumen der Settings-Zeile bei UserDeletedEvent (muss vor dem
 * eigentlichen User-Löschen laufen, siehe CLAUDE.md).
 */
@ExtendWith(MockitoExtension.class)
class NotificationSettingsServiceTest {

    @Mock
    private NotificationSettingsRepository notificationSettingsRepository;

    @Mock
    private CurrentUserService currentUserService;

    private NotificationSettingsService notificationSettingsService;
    private User user;

    @BeforeEach
    void setUp() {
        notificationSettingsService = new NotificationSettingsService(notificationSettingsRepository, currentUserService);

        user = User.builder().id(UUID.randomUUID()).email("user@example.com").build();
        lenient().when(currentUserService.get()).thenReturn(user);
    }

    @Test
    void getCurrentSettings_createsSettingsWithDefaultsWhenNoneExistYet() {
        when(notificationSettingsRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
        when(notificationSettingsRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationSettingsResponse response = notificationSettingsService.getCurrentSettings();

        assertThat(response.emailEnabled()).isTrue();
        assertThat(response.pushEnabled()).isTrue();
        assertThat(response.reminderLeadTime()).isEqualTo(ReminderLeadTime.TWENTY_FOUR_HOURS);
        verify(notificationSettingsRepository).save(any());
    }

    @Test
    void getCurrentSettings_returnsExistingSettingsWithoutCreatingNewOnes() {
        NotificationSettings existing = existingSettings();
        when(notificationSettingsRepository.findByUserId(user.getId())).thenReturn(Optional.of(existing));

        NotificationSettingsResponse response = notificationSettingsService.getCurrentSettings();

        assertThat(response.emailEnabled()).isEqualTo(existing.getEmailEnabled());
        verify(notificationSettingsRepository, never()).save(any());
    }

    @Test
    void updateCurrentSettings_leavesFieldsUntouchedWhenNotProvided() {
        NotificationSettings existing = existingSettings();
        existing.setEmailEnabled(true);
        existing.setPushEnabled(false);
        when(notificationSettingsRepository.findByUserId(user.getId())).thenReturn(Optional.of(existing));

        notificationSettingsService.updateCurrentSettings(new NotificationSettingsResponse(null, null, null));

        assertThat(existing.getEmailEnabled()).isTrue();
        assertThat(existing.getPushEnabled()).isFalse();
    }

    @Test
    void updateCurrentSettings_appliesOnlyProvidedFields() {
        NotificationSettings existing = existingSettings();
        existing.setEmailEnabled(true);
        existing.setPushEnabled(true);
        existing.setReminderLeadTime(ReminderLeadTime.TWENTY_FOUR_HOURS);
        when(notificationSettingsRepository.findByUserId(user.getId())).thenReturn(Optional.of(existing));

        NotificationSettingsResponse response = notificationSettingsService
                .updateCurrentSettings(new NotificationSettingsResponse(false, null, ReminderLeadTime.ONE_HOUR));

        assertThat(response.emailEnabled()).isFalse();
        assertThat(response.pushEnabled()).isTrue();
        assertThat(response.reminderLeadTime()).isEqualTo(ReminderLeadTime.ONE_HOUR);
        verify(notificationSettingsRepository).save(existing);
    }

    @Test
    void onUserDeleted_removesSettingsRowWhenPresent() {
        NotificationSettings existing = existingSettings();
        when(notificationSettingsRepository.findByUserId(user.getId())).thenReturn(Optional.of(existing));

        notificationSettingsService.onUserDeleted(new UserDeletedEvent(user.getId()));

        verify(notificationSettingsRepository).delete(existing);
    }

    @Test
    void onUserDeleted_doesNothingWhenNoSettingsRowExists() {
        when(notificationSettingsRepository.findByUserId(user.getId())).thenReturn(Optional.empty());

        notificationSettingsService.onUserDeleted(new UserDeletedEvent(user.getId()));

        verify(notificationSettingsRepository, never()).delete(any());
    }

    private NotificationSettings existingSettings() {
        return NotificationSettings.builder().id(UUID.randomUUID()).user(user).build();
    }
}
