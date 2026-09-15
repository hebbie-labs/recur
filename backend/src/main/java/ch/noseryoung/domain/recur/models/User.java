package ch.noseryoung.domain.recur.models;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.proxy.HibernateProxy;

import com.fasterxml.jackson.annotation.JsonIgnore;

import ch.noseryoung.domain.recur.enums.AuthProvider;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "app_user", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
// Ownership/membership checks (TaskService.hasAccess, group.getMembers().contains(user),
// etc.) compare User instances loaded from unrelated Hibernate sessions - e.g. the
// JWT-authenticated principal vs. a Task's owner loaded inside the request's own
// transaction. Those are never the same Java object, so without an id-based equals()
// the default reference equality made every such check silently fail.
@EqualsAndHashCode(of = "id")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @NotBlank(message = "E-Mail ist erforderlich")
    @Email(message = "E-Mail muss gültig sein")
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    // Bleibt null für Nutzer, die sich nur über OAuth2 (Google) registriert haben.
    // @JsonIgnore, da User-Objekte über verschachtelte Referenzen (z.B. Task.owner,
    // TaskGroup.members) direkt serialisiert werden und der Hash sonst an jeden
    // mitliest, der ein Task/eine Gruppe abruft.
    @JsonIgnore
    @Size(min = 8, message = "Passwort muss mindestens 8 Zeichen lang sein")
    @Column(name = "password_hash")
    private String passwordHash;

    @NotBlank(message = "Vorname ist erforderlich")
    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Builder.Default
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    private AuthProvider provider = AuthProvider.LOCAL;

    @Builder.Default
    @Column(name = "enabled", nullable = false, columnDefinition = "boolean default true")
    private Boolean enabled = true;

    @CreationTimestamp
    @Column(name = "date_created", updatable = false)
    private Instant dateCreated;

    // Ohne diese Überschreibung vergleicht Set.contains() (z.B. bei
    // Gruppen-Mitgliedschaftsprüfungen) per Objekt-Identität. Das schlägt fast
    // immer fehl, da ein aus dem SecurityContext geladener User und ein über
    // eine Assoziation (z.B. TaskGroup.members) geladener User bzw. Hibernate-
    // Proxy zwei verschiedene Java-Objekte für dieselbe DB-Zeile sein können.
    @Override
    public final boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null) {
            return false;
        }
        Class<?> thisClass = this instanceof HibernateProxy thisProxy
                ? thisProxy.getHibernateLazyInitializer().getPersistentClass()
                : getClass();
        Class<?> otherClass = o instanceof HibernateProxy otherProxy
                ? otherProxy.getHibernateLazyInitializer().getPersistentClass()
                : o.getClass();
        if (thisClass != otherClass) {
            return false;
        }
        User other = (User) o;
        // getId() statt direktem Feldzugriff: bei einem HibernateProxy ist das
        // Feld selbst nicht befüllt, nur der Getter delegiert ans Ziel-Objekt.
        return getId() != null && getId().equals(other.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy proxy
                ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode()
                : getClass().hashCode();
    }
}