package ch.noseryoung.domain.recur.notification.service;

import ch.noseryoung.domain.recur.shared.service.EmailService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.task.event.ProjectTaskCreatedEvent;
import ch.noseryoung.domain.recur.task.event.TasksDeletedEvent;
import ch.noseryoung.domain.recur.task.model.Task;
import ch.noseryoung.domain.recur.notification.model.NotificationSettings;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.notification.repository.NotificationLogRepository;
import ch.noseryoung.domain.recur.notification.repository.NotificationSettingsRepository;

// Bündelt Email-/Push-Versand hinter den beiden Empfänger-Toggles
// (emailEnabled/pushEnabled) - gemeinsam genutzt vom TaskReminderScheduler
// (#102, Erinnerung/Überfällig) und TaskService (neuer Projekt-Task).
@Service
public class NotificationDispatchService {

    private final NotificationSettingsRepository notificationSettingsRepository;
    private final NotificationLogRepository notificationLogRepository;
    private final EmailService emailService;
    private final PushNotificationService pushNotificationService;

    // Vorläufiger globaler Kill-Switch für Task-Benachrichtigungs-Mails
    // (Erinnerung/Überfällig/neuer Projekt-Task), unabhängig vom
    // Nutzer-Toggle emailEnabled - siehe bekanntes dpdns.org-Zustell-
    // problem in CLAUDE.md (#126). Betrifft nicht Verifizierungs-/
    // Passwort-Reset-/Willkommens-Mails in EmailService, die weiter
    // versendet werden. Push bleibt unverändert an.
    @Value("${app.notifications.email-enabled:false}")
    private boolean emailNotificationsEnabled;

    public NotificationDispatchService(
            NotificationSettingsRepository notificationSettingsRepository,
            NotificationLogRepository notificationLogRepository,
            EmailService emailService,
            PushNotificationService pushNotificationService) {
        this.notificationSettingsRepository = notificationSettingsRepository;
        this.notificationLogRepository = notificationLogRepository;
        this.emailService = emailService;
        this.pushNotificationService = pushNotificationService;
    }

    // Kein Persistieren fehlender Settings hier (anders als
    // NotificationSettingsService.getOrCreateSettings) - ein Scheduler-Lauf
    // über potenziell alle User soll nicht bei jedem Durchlauf Zeilen für
    // Nutzer ohne eigene Einstellungen anlegen. Die In-Memory-Defaults
    // entsprechen denen der Entity.
    private NotificationSettings settingsFor(User recipient) {
        return notificationSettingsRepository.findByUserId(recipient.getId())
                .orElseGet(() -> NotificationSettings.builder().user(recipient).build());
    }

    public void sendReminder(User recipient, Task task) {
        NotificationSettings settings = settingsFor(recipient);
        if (emailNotificationsEnabled && Boolean.TRUE.equals(settings.getEmailEnabled())) {
            emailService.send(recipient.getEmail(), "Erinnerung: \"" + task.getName() + "\" ist bald fällig",
                    "Hallo " + recipient.getFirstName() + ",\n\n"
                            + "dein Task \"" + task.getName() + "\" ist bald fällig.\n\n"
                            + "Viel Erfolg!");
        }
        if (Boolean.TRUE.equals(settings.getPushEnabled())) {
            pushNotificationService.sendToUser(recipient, "Bald fällig",
                    "\"" + task.getName() + "\" ist bald fällig.");
        }
    }

    public void sendOverdue(User recipient, Task task) {
        NotificationSettings settings = settingsFor(recipient);
        if (emailNotificationsEnabled && Boolean.TRUE.equals(settings.getEmailEnabled())) {
            emailService.send(recipient.getEmail(), "Überfällig: \"" + task.getName() + "\"",
                    "Hallo " + recipient.getFirstName() + ",\n\n"
                            + "dein Task \"" + task.getName() + "\" ist überfällig und noch nicht erledigt.\n\n"
                            + "Du kannst ihn in Recur abschliessen oder archivieren.");
        }
        if (Boolean.TRUE.equals(settings.getPushEnabled())) {
            pushNotificationService.sendToUser(recipient, "Überfällig",
                    "\"" + task.getName() + "\" ist überfällig.");
        }
    }

    // Läuft über ein Event, da task (Aufrufer: TaskService) nicht von
    // notification abhängen darf (siehe ProjectTaskCreatedEvent).
    @EventListener
    public void onProjectTaskCreated(ProjectTaskCreatedEvent event) {
        event.recipients().forEach(recipient -> sendProjectTaskCreated(recipient, event.task(), event.creator()));
    }

    // Ersetzt Task.notificationLogs (frühere JPA-Cascade REMOVE) - muss
    // synchron laufen, bevor TaskService die Tasks selbst löscht, sonst
    // schlägt die FK-Constraint von notification_log.task_id fehl.
    @EventListener
    public void onTasksDeleted(TasksDeletedEvent event) {
        notificationLogRepository.deleteByTaskIdIn(event.taskIds());
    }

    private void sendProjectTaskCreated(User recipient, Task task, User creator) {
        NotificationSettings settings = settingsFor(recipient);
        if (emailNotificationsEnabled && Boolean.TRUE.equals(settings.getEmailEnabled())) {
            emailService.send(recipient.getEmail(), "Neuer Task in eurem Projekt: \"" + task.getName() + "\"",
                    "Hallo " + recipient.getFirstName() + ",\n\n"
                            + creator.getFirstName() + " hat den Task \"" + task.getName()
                            + "\" für euer gemeinsames Projekt erstellt.");
        }
        if (Boolean.TRUE.equals(settings.getPushEnabled())) {
            pushNotificationService.sendToUser(recipient, "Neuer Projekt-Task",
                    creator.getFirstName() + " hat \"" + task.getName() + "\" erstellt.");
        }
    }
}
