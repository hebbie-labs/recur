package ch.noseryoung.domain.recur.models;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
}
