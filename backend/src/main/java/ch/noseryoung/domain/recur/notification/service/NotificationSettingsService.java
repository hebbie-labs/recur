package ch.noseryoung.domain.recur.notification.service;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.notification.dto.NotificationSettingsResponse;
import ch.noseryoung.domain.recur.notification.model.NotificationSettings;
import ch.noseryoung.domain.recur.notification.repository.NotificationSettingsRepository;
import ch.noseryoung.domain.recur.user.event.UserDeletedEvent;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.service.CurrentUserService;

@Service
public class NotificationSettingsService {

    private final NotificationSettingsRepository notificationSettingsRepository;
    private final CurrentUserService currentUserService;

    public NotificationSettingsService(NotificationSettingsRepository notificationSettingsRepository,
            CurrentUserService currentUserService) {
        this.notificationSettingsRepository = notificationSettingsRepository;
        this.currentUserService = currentUserService;
    }

    // Nutzer, die vor Einführung dieser Einstellungen registriert wurden, haben
    // noch keine NotificationSettings-Zeile - beim ersten Zugriff wird sie mit
    // den Standardwerten angelegt, statt eine Migration für Bestandsnutzer zu
    // brauchen.
    private NotificationSettings getOrCreateSettings(User user) {
        return notificationSettingsRepository.findByUserId(user.getId())
                .orElseGet(() -> notificationSettingsRepository.save(
                        NotificationSettings.builder().user(user).build()));
    }

    public NotificationSettingsResponse getCurrentSettings() {
        User user = currentUserService.get();
        return NotificationSettingsResponse.from(getOrCreateSettings(user));
    }

    public NotificationSettingsResponse updateCurrentSettings(NotificationSettingsResponse update) {
        User user = currentUserService.get();
        NotificationSettings settings = getOrCreateSettings(user);

        if (update.emailEnabled() != null) {
            settings.setEmailEnabled(update.emailEnabled());
        }
        if (update.pushEnabled() != null) {
            settings.setPushEnabled(update.pushEnabled());
        }
        if (update.reminderLeadTime() != null) {
            settings.setReminderLeadTime(update.reminderLeadTime());
        }

        notificationSettingsRepository.save(settings);

        return NotificationSettingsResponse.from(settings);
    }

    // Räumt beim Löschen eines Accounts (siehe UserService#deleteCurrentUser)
    // die NotificationSettings-Zeile des Users auf - muss synchron laufen,
    // bevor UserService den User selbst löscht, sonst schlägt die
    // FK-Constraint von notification_settings.user_id fehl.
    @EventListener
    public void onUserDeleted(UserDeletedEvent event) {
        notificationSettingsRepository.findByUserId(event.userId())
                .ifPresent(notificationSettingsRepository::delete);
    }
}
