package ch.noseryoung.domain.recur.notification.model;

import ch.noseryoung.domain.recur.user.model.User;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

import ch.noseryoung.domain.recur.task.enums.ReminderLeadTime;
import jakarta.persistence.*;
import lombok.*;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "notification_settings")
public class NotificationSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    // @JsonIgnore, da der User bereits über die eigenen Auth-Endpunkte abgefragt
    // wird - die Notification-Settings-Antwort muss ihn nicht mitschicken.
    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @Column(name = "email_enabled", nullable = false, columnDefinition = "boolean default true")
    private Boolean emailEnabled = true;

    @Builder.Default
    @Column(name = "push_enabled", nullable = false, columnDefinition = "boolean default true")
    private Boolean pushEnabled = true;

    // Wie lange vor Task.dateUntil die Erinnerungs-Benachrichtigung (#102)
    // verschickt wird - siehe ReminderLeadTime.
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "reminder_lead_time", nullable = false, columnDefinition = "varchar(32) default 'TWENTY_FOUR_HOURS'")
    private ReminderLeadTime reminderLeadTime = ReminderLeadTime.TWENTY_FOUR_HOURS;
}
