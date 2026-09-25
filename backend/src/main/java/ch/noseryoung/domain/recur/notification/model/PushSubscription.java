package ch.noseryoung.domain.recur.notification.model;

import ch.noseryoung.domain.recur.user.model.User;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

// Eine Web-Push-Subscription (#102) eines Browsers/Geräts. Ein User kann
// mehrere gleichzeitig haben (z.B. Laptop + Handy) - Push wird an alle
// gesendet, eine ungültig gewordene (410 Gone) wird einzeln entfernt.
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "push_subscription")
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank
    @Column(name = "endpoint", nullable = false, unique = true, length = 1024)
    private String endpoint;

    @NotBlank
    @Column(name = "p256dh_key", nullable = false)
    private String p256dhKey;

    @NotBlank
    @Column(name = "auth_key", nullable = false)
    private String authKey;

    @CreationTimestamp
    @Column(name = "date_created", updatable = false)
    private Instant dateCreated;
}
