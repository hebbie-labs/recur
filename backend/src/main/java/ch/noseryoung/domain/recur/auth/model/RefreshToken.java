package ch.noseryoung.domain.recur.auth.model;

import ch.noseryoung.domain.recur.user.model.User;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

// Eine Zeile pro Geräte-Session (sessionId bleibt über Rotationen hinweg
// gleich, id wechselt bei jeder Rotation). Reuse eines bereits rotierten
// (revoked=true) Tokens ist ein Diebstahl-Signal -> nur diese eine Session
// wird revoked, siehe RefreshTokenService#rotate.
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "refresh_token")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    // @JsonIgnore, da RefreshToken nie direkt serialisiert werden soll - der
    // User würde sonst mit seinen sensiblen Feldern mitgeschickt.
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // SHA-256-Hash des rohen Tokens, nicht der Klartext - anders als bei
    // VerificationToken/PasswordResetToken, da Refresh-Tokens 30 Tage statt
    // Stunden gültig sind und als Bearer-Cookie vollen Kontozugriff geben.
    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Builder.Default
    @Column(name = "revoked", nullable = false)
    private Boolean revoked = false;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @CreationTimestamp
    @Column(name = "date_created", updatable = false)
    private Instant dateCreated;
}
