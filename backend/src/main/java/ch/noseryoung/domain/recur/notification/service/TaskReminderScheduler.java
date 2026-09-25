package ch.noseryoung.domain.recur.notification.service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.task.model.Task;
import ch.noseryoung.domain.recur.notification.enums.NotificationType;
import ch.noseryoung.domain.recur.task.enums.ReminderLeadTime;
import ch.noseryoung.domain.recur.task.service.TaskService;
import ch.noseryoung.domain.recur.notification.model.NotificationLog;
import ch.noseryoung.domain.recur.notification.model.NotificationSettings;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.notification.repository.NotificationLogRepository;
import ch.noseryoung.domain.recur.notification.repository.NotificationSettingsRepository;

// #102: erkennt Tasks, die sich ihrem dateUntil nähern oder es bereits
// überschritten haben, und löst darüber Erinnerungs-/Überfällig-
// Benachrichtigungen aus. Läuft alle 15 Minuten - genug Auflösung für die
// 1h-Überfällig-Schwelle zeitgebundener Tasks, ohne bei jedem Request zu prüfen.
@Component
public class TaskReminderScheduler {

    // Feste, nicht konfigurierbare Überfällig-Schwelle (#102): zeitgebundene
    // Tasks (startTime gesetzt) gelten 1h nach dateUntil als überfällig,
    // reine Datums-Tasks (kein startTime) erst nach 1 Tag.
    private static final Duration OVERDUE_AFTER_TIMED = Duration.ofHours(1);
    private static final Duration OVERDUE_AFTER_ALL_DAY = Duration.ofDays(1);

    private final TaskService taskService;
    private final NotificationSettingsRepository notificationSettingsRepository;
    private final NotificationLogRepository notificationLogRepository;
    private final NotificationDispatchService notificationDispatchService;

    public TaskReminderScheduler(
            TaskService taskService,
            NotificationSettingsRepository notificationSettingsRepository,
            NotificationLogRepository notificationLogRepository,
            NotificationDispatchService notificationDispatchService) {
        this.taskService = taskService;
        this.notificationSettingsRepository = notificationSettingsRepository;
        this.notificationLogRepository = notificationLogRepository;
        this.notificationDispatchService = notificationDispatchService;
    }

    // Transaktion noetig, weil recipientsOf() ueber lazy
    // task.getProject().getGroup() geht - ohne offene Session wirft das eine
    // LazyInitializationException und reisst den ganzen Scheduler-Lauf ab.
    // Nicht readOnly, da processReminder/processOverdue NotificationLog-Zeilen schreiben.
    @Scheduled(fixedRate = 15 * 60 * 1000)
    @Transactional
    public void checkDueTasks() {
        Instant now = Instant.now();

        for (Task task : taskService.findDueTasks()) {
            for (User recipient : recipientsOf(task)) {
                processReminder(task, recipient, now);
                processOverdue(task, recipient, now);
            }
        }
    }

    // Persönliche Tasks: nur der owner. Projekt-Tasks: die zugewiesenen
    // Mitglieder (bzw. alle Gruppenmitglieder, solange noch niemand
    // zugewiesen ist), abzüglich wer seine Kopie bereits für sich archiviert
    // hat (siehe TaskService#applyArchivedChange) - für die ist der Task
    // bereits erledigt.
    private Set<User> recipientsOf(Task task) {
        if (task.getOwner() != null) {
            return Set.of(task.getOwner());
        }

        if (task.getProject() == null || task.getProject().getGroup() == null) {
            return Set.of();
        }

        Set<User> candidates = task.getAssignedMembers().isEmpty()
                ? task.getProject().getGroup().getMembers()
                : task.getAssignedMembers();

        Set<User> recipients = new HashSet<>(candidates);
        recipients.removeAll(task.getArchivedBy());
        return recipients;
    }

    private void processReminder(Task task, User recipient, Instant now) {
        if (notificationLogRepository.existsByTaskAndRecipientAndType(task, recipient, NotificationType.REMINDER)) {
            return;
        }

        Duration leadTime = leadTimeOf(task, recipient);
        if (now.isBefore(task.getDateUntil().minus(leadTime))) {
            return;
        }

        notificationDispatchService.sendReminder(recipient, task);
        notificationLogRepository.save(NotificationLog.builder()
                .task(task)
                .recipient(recipient)
                .type(NotificationType.REMINDER)
                .build());
    }

    private void processOverdue(Task task, User recipient, Instant now) {
        if (notificationLogRepository.existsByTaskAndRecipientAndType(task, recipient, NotificationType.OVERDUE)) {
            return;
        }

        Duration overdueAfter = task.getStartTime() != null ? OVERDUE_AFTER_TIMED : OVERDUE_AFTER_ALL_DAY;
        if (now.isBefore(task.getDateUntil().plus(overdueAfter))) {
            return;
        }

        notificationDispatchService.sendOverdue(recipient, task);
        notificationLogRepository.save(NotificationLog.builder()
                .task(task)
                .recipient(recipient)
                .type(NotificationType.OVERDUE)
                .build());
    }

    // Ein vom Empfänger selbst für diesen Task gesetzter Override
    // (#102-Follow-up, TaskReminderOverride) hat Vorrang vor seiner
    // Kontoeinstellung. Pro (task, recipient), nicht pro Task, da geteilte
    // Projekt-Tasks mehrere Empfänger mit je eigenem Vorlauf haben können.
    private Duration leadTimeOf(Task task, User recipient) {
        return taskService.reminderLeadTimeOverride(task, recipient)
                .or(() -> notificationSettingsRepository.findByUserId(recipient.getId())
                        .map(NotificationSettings::getReminderLeadTime))
                .orElse(ReminderLeadTime.TWENTY_FOUR_HOURS)
                .getLeadTime();
    }
}
