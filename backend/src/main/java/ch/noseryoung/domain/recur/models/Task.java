package ch.noseryoung.domain.recur.models;

import java.time.Instant;
import java.util.*;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import ch.noseryoung.domain.recur.enums.Category;
import ch.noseryoung.domain.recur.enums.Frequency;
import lombok.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "task")
public class Task {

        // Marker-Interface für Validation-Groups: Constraints unten gelten nur beim
        // Erstellen (POST), nicht bei partiellen PATCH-Updates, da patchTask()
        // bewusst leere Felder als "nicht ändern" interpretiert.
        public interface OnCreate {
        }

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        @Column(name = "id")
        private UUID id;

        @NotBlank(message = "Name ist erforderlich", groups = OnCreate.class)
        @Size(min = 2, max = 40, message = "Name muss zwischen 2 und 40 Zeichen lang sein", groups = OnCreate.class)
        @Column(name = "name")
        private String name;

        @NotNull(message = "Kategorie ist erforderlich", groups = OnCreate.class)
        @Enumerated(EnumType.STRING)
        @Column(name = "category")
        private Category category;

        @NotNull(message = "Frequenz ist erforderlich", groups = OnCreate.class)
        @Enumerated(EnumType.STRING)
        @Column(name = "frequency")
        private Frequency frequency;

        @NotBlank(message = "Beschreibung ist erforderlich", groups = OnCreate.class)
        @Size(max = 200, message = "Beschreibung darf maximal 200 Zeichen lang sein", groups = OnCreate.class)
        @Column(name = "description")
        private String description;

        @NotNull(message = "Fälligkeitsdatum ist erforderlich", groups = OnCreate.class)
        @Future(message = "Fälligkeitsdatum muss in der Zukunft liegen", groups = OnCreate.class)
        @Column(name = "date_until")
        private Instant dateUntil;

        @Column(name = "progress")
        private Double progress;

        @CreationTimestamp
        @Column(name = "date_created", updatable = false)
        private Instant dateCreated;

        // Wird bei jedem Save automatisch neu gesetzt (Hibernate). Dient dem
        // Frontend-Polling als Last-Write-Wins-Vergleichswert, damit ein Sync-Poll
        // laufende optimistische UI-Updates nicht überschreibt.
        @UpdateTimestamp
        @Column(name = "updated_at")
        private Instant updatedAt;

        @Column(name = "days_in_span")
        private Integer daysInSpan;

        @Column(name = "amount_did")
        private Integer amountDid;

        @Builder.Default
        @Column(name = "is_favorite", nullable = false, columnDefinition = "boolean default false")
        private Boolean isFavorite = false;

        @Builder.Default
        @Column(name = "is_archived", nullable = false, columnDefinition = "boolean default false")
        private Boolean isArchived = false;

        // Bei einem persönlichen Task gesetzt. Ist der Task stattdessen einem
        // Projekt zugeordnet (siehe unten), ist er ein geteiltes Item ohne
        // einzelnen Besitzer - dann bleibt owner null und der Zugriff läuft
        // über die Mitgliedschaft in project.group.
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id")
        private User owner;

        @Column(name = "duration_minutes")
        private Integer durationMinutes;

        @Column(name = "start_time")
        private Instant startTime;

        // Optionale Zuordnung zu einem Gruppen-Projekt. Gesetzt <=> der Task ist
        // ein geteiltes Checklisten-Item für alle Mitglieder der Projekt-Gruppe
        // statt eines persönlichen Tasks.
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "project_id")
        private Project project;

        // Wird gesetzt, sobald der Task (für ein Projekt) als erledigt markiert
        // wird, und wieder auf null gesetzt sobald er zurückgesetzt wird. Nur für
        // geteilte Projekt-Tasks relevant, bei persönlichen Tasks ungenutzt.
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "completed_by")
        private User completedBy;
}