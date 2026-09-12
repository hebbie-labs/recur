package ch.noseryoung.domain.recur.models;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "task_group")
public class TaskGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @NotBlank(message = "Name ist erforderlich")
    @Size(min = 2, max = 60, message = "Name muss zwischen 2 und 60 Zeichen lang sein")
    @Column(name = "name")
    private String name;

    // Code für den Beitritts-Link. Dauerhaft gültig und mehrfach nutzbar (v1
    // hat kein Widerrufen/Neu-generieren).
    @Column(name = "invite_code", nullable = false, unique = true)
    private String inviteCode;

    @CreationTimestamp
    @Column(name = "date_created", updatable = false)
    private Instant dateCreated;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    // Alle Mitglieder sind gleichberechtigt - keine Rolle auf der
    // Mitgliedschaft, jedes Mitglied kann die Gruppe verwalten/löschen.
    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "task_group_member", joinColumns = @JoinColumn(name = "group_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<User> members = new HashSet<>();
}
