package ch.noseryoung.domain.recur.user.service;

import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.user.dto.PrivacySettingsResponse;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.model.UserPrivacySettings;
import ch.noseryoung.domain.recur.user.repository.UserPrivacySettingsRepository;

@Service
public class PrivacySettingsService {

    private final UserPrivacySettingsRepository privacySettingsRepository;
    private final CurrentUserService currentUserService;

    public PrivacySettingsService(UserPrivacySettingsRepository privacySettingsRepository,
            CurrentUserService currentUserService) {
        this.privacySettingsRepository = privacySettingsRepository;
        this.currentUserService = currentUserService;
    }

    // Nutzer, die vor Einführung dieser Einstellungen registriert wurden, haben
    // noch keine UserPrivacySettings-Zeile - beim ersten Zugriff wird sie mit den
    // Standardwerten angelegt, statt eine Migration für Bestandsnutzer zu brauchen.
    private UserPrivacySettings getOrCreateSettings(User user) {
        return privacySettingsRepository.findByUserId(user.getId())
                .orElseGet(() -> privacySettingsRepository.save(
                        UserPrivacySettings.builder().user(user).build()));
    }

    public PrivacySettingsResponse getCurrentSettings() {
        User user = currentUserService.get();
        return PrivacySettingsResponse.from(getOrCreateSettings(user));
    }

    public PrivacySettingsResponse updateCurrentSettings(PrivacySettingsResponse update) {
        User user = currentUserService.get();
        UserPrivacySettings settings = getOrCreateSettings(user);

        if (update.profileVisibility() != null) {
            settings.setProfileVisibility(update.profileVisibility());
        }
        if (update.analyticsOptIn() != null) {
            settings.setAnalyticsOptIn(update.analyticsOptIn());
        }

        privacySettingsRepository.save(settings);

        return PrivacySettingsResponse.from(settings);
    }
}
