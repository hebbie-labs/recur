package ch.noseryoung.domain.recur.dto;

import ch.noseryoung.domain.recur.models.NotificationSettings;

// Auch für PATCH /api/auth/me/notification-settings verwendet: null-Felder
// bedeuten "nicht ändern" (Analogon zu Task.OnCreate, siehe
// NotificationSettingsService.updateCurrentSettings).
public record NotificationSettingsResponse(
        Boolean emailEnabled,
        Boolean pushEnabled) {

    public static NotificationSettingsResponse from(NotificationSettings settings) {
        return new NotificationSettingsResponse(
                settings.getEmailEnabled(),
                settings.getPushEnabled());
    }
}
