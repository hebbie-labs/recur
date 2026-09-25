package ch.noseryoung.domain.recur.notification.dto;

import ch.noseryoung.domain.recur.task.enums.ReminderLeadTime;
import ch.noseryoung.domain.recur.notification.model.NotificationSettings;

// Auch für PATCH /api/auth/me/notification-settings verwendet: null-Felder
// bedeuten "nicht ändern" (Analogon zu Task.OnCreate, siehe
// NotificationSettingsService.updateCurrentSettings).
public record NotificationSettingsResponse(
        Boolean emailEnabled,
        Boolean pushEnabled,
        ReminderLeadTime reminderLeadTime) {

    public static NotificationSettingsResponse from(NotificationSettings settings) {
        return new NotificationSettingsResponse(
                settings.getEmailEnabled(),
                settings.getPushEnabled(),
                settings.getReminderLeadTime());
    }
}
