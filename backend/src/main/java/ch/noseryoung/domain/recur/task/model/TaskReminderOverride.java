package ch.noseryoung.domain.recur.task.model;

import ch.noseryoung.domain.recur.user.model.User;

import java.util.UUID;

import ch.noseryoung.domain.recur.task.enums.ReminderLeadTime;
import jakarta.persistence.*;
import lombok.*;

// Erinnerungs-Vorlauf, den ein einzelner User sich selbst für einen
// einzelnen Task einstellt (#102-Follow-up) - bewusst pro (task, user),
// nicht ein Feld auf Task selbst: bei geteilten Projekt-Tasks hat jedes
// zugewiesene Mitglied seine eigene Erinnerung, nicht eine gemeinsame.
// Fehlt eine Zeile, fällt TaskReminderScheduler auf die Kontoeinstellung
// des Users zurück (NotificationSettings.reminderLeadTime).
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "task_reminder_override", uniqueConstraints = @UniqueConstraint(columnNames = { "task_id",
        "user_id" }))
public class TaskReminderOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "reminder_lead_time", nullable = false)
    private ReminderLeadTime reminderLeadTime;
}
