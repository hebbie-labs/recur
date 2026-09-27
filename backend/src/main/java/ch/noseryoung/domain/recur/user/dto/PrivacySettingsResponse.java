package ch.noseryoung.domain.recur.user.dto;

import ch.noseryoung.domain.recur.user.enums.ProfileVisibility;
import ch.noseryoung.domain.recur.user.model.UserPrivacySettings;

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
