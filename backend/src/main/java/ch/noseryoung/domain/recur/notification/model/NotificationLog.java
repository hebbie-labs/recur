package ch.noseryoung.domain.recur.notification.model;

import ch.noseryoung.domain.recur.task.model.Task;
import ch.noseryoung.domain.recur.user.model.User;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import ch.noseryoung.domain.recur.notification.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

// Dedup-Journal für Scheduler-verschickte Task-Benachrichtigungen (#102):
// pro (task, recipient, type) darf höchstens ein Eintrag existieren, sonst
// würde jeder Scheduler-Durchlauf dieselbe Erinnerung erneut verschicken.
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "notification_log", uniqueConstraints = @UniqueConstraint(columnNames = { "task_id", "recipient_id",
        "type" }))
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    @CreationTimestamp
    @Column(name = "sent_at", updatable = false)
    private Instant sentAt;
}
