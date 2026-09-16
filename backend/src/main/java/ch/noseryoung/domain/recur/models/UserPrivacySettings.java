package ch.noseryoung.domain.recur.models;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

import ch.noseryoung.domain.recur.enums.ProfileVisibility;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "user_privacy_settings")
public class UserPrivacySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    // @JsonIgnore, da der User bereits über die eigenen Auth-Endpunkte abgefragt
    // wird - die Privacy-Settings-Antwort muss ihn nicht mitschicken.
    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "profile_visibility", nullable = false)
    private ProfileVisibility profileVisibility = ProfileVisibility.VISIBLE;

    @Builder.Default
    @Column(name = "analytics_opt_in", nullable = false, columnDefinition = "boolean default true")
    private Boolean analyticsOptIn = true;
}
