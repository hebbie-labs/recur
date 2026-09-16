package ch.noseryoung.domain.recur.dto;

import ch.noseryoung.domain.recur.enums.ProfileVisibility;
import ch.noseryoung.domain.recur.models.UserPrivacySettings;

// Auch für PATCH /api/auth/me/privacy-settings verwendet: null-Felder bedeuten
// "nicht ändern" (Analogon zu Task.OnCreate, siehe PrivacySettingsService.updateCurrentSettings).
public record PrivacySettingsResponse(
        ProfileVisibility profileVisibility,
        Boolean analyticsOptIn) {

    public static PrivacySettingsResponse from(UserPrivacySettings settings) {
        return new PrivacySettingsResponse(
                settings.getProfileVisibility(),
                settings.getAnalyticsOptIn());
    }
}
