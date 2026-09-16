package ch.noseryoung.domain.recur.services;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.dto.PrivacySettingsResponse;
import ch.noseryoung.domain.recur.models.User;
import ch.noseryoung.domain.recur.models.UserPrivacySettings;
import ch.noseryoung.domain.recur.repositories.UserPrivacySettingsRepository;
import ch.noseryoung.domain.recur.repositories.UserRepository;

@Service
public class PrivacySettingsService {

    private final UserRepository userRepository;
    private final UserPrivacySettingsRepository privacySettingsRepository;

    public PrivacySettingsService(UserRepository userRepository,
            UserPrivacySettingsRepository privacySettingsRepository) {
        this.userRepository = userRepository;
        this.privacySettingsRepository = privacySettingsRepository;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authentifizierter User nicht gefunden: " + email));
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
        User user = getCurrentUser();
        return PrivacySettingsResponse.from(getOrCreateSettings(user));
    }

    public PrivacySettingsResponse updateCurrentSettings(PrivacySettingsResponse update) {
        User user = getCurrentUser();
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
