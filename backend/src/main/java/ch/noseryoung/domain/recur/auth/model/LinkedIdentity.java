package ch.noseryoung.domain.recur.auth.model;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

import ch.noseryoung.domain.recur.user.enums.AuthProvider;
import ch.noseryoung.domain.recur.user.model.User;
import jakarta.persistence.*;
import lombok.*;

// Eine mit einem Recur-Account verknüpfte 3rd-Party-Identität (#236). Ein
// Account kann mehrere davon haben (Google + GitHub) zusätzlich zu seinem
// lokalen Passwort. Aufgelöst wird beim OAuth-Login über (provider, subjectId)
// statt über die E-Mail - die kann sich beim Provider ändern, und ein reiner
// E-Mail-Match hat vorher jeden in einen fremden lokalen Account eingeloggt.
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "linked_identity", uniqueConstraints = @UniqueConstraint(columnNames = { "provider", "subject_id" }))
public class LinkedIdentity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    private AuthProvider provider;

    // Google: "sub" aus dem ID-Token, GitHub: numerische User-"id".
    @Column(name = "subject_id", nullable = false)
    private String subjectId;

    @CreationTimestamp
    @Column(name = "date_created", updatable = false)
    private Instant dateCreated;
}
