package ch.noseryoung.domain.recur.user.service;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.user.enums.ProfileVisibility;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.model.UserPrivacySettings;
import ch.noseryoung.domain.recur.user.repository.UserPrivacySettingsRepository;

// Setzt die Datenschutzerklärung um: ein Mitglied mit profileVisibility=HIDDEN
// zeigt anderen Gruppenmitgliedern (nie sich selbst) nur noch Initialen statt
// Vor-/Nachname, und kein Profilbild. Liefert dafür transiente Kopien der
// betroffenen User (nie die verwaltete Entity selbst), damit nichts davon
// versehentlich in die DB zurückgeschrieben wird.
@Service
public class UserVisibilityService {

    private final UserPrivacySettingsRepository privacySettingsRepository;

    public UserVisibilityService(UserPrivacySettingsRepository privacySettingsRepository) {
        this.privacySettingsRepository = privacySettingsRepository;
    }

    public User maskIfHidden(User target, User viewer) {
        if (target == null || target.equals(viewer)) {
            return target;
        }

        ProfileVisibility visibility = privacySettingsRepository.findByUserId(target.getId())
                .map(UserPrivacySettings::getProfileVisibility)
                .orElse(ProfileVisibility.VISIBLE);

        return mask(target, visibility);
    }

    public Set<User> maskIfHidden(Collection<User> targets, User viewer) {
        List<UUID> idsToCheck = targets.stream()
                .filter(target -> !target.equals(viewer))
                .map(User::getId)
                .toList();

        Map<UUID, ProfileVisibility> visibilityByUserId = privacySettingsRepository.findByUserIdIn(idsToCheck).stream()
                .collect(Collectors.toMap(settings -> settings.getUser().getId(),
                        UserPrivacySettings::getProfileVisibility));

        return targets.stream()
                .map(target -> target.equals(viewer)
                        ? target
                        : mask(target, visibilityByUserId.getOrDefault(target.getId(), ProfileVisibility.VISIBLE)))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private User mask(User target, ProfileVisibility visibility) {
        if (visibility != ProfileVisibility.HIDDEN) {
            return target;
        }

        return target.toBuilder()
                .firstName(initial(target.getFirstName()))
                .lastName(initial(target.getLastName()))
                .avatarUrl(null)
                .build();
    }

    private String initial(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }
        return name.substring(0, 1).toUpperCase() + ".";
    }
}
