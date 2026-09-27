package ch.noseryoung.domain.recur.task.model;

import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.group.model.Project;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import ch.noseryoung.domain.recur.task.enums.Category;
import ch.noseryoung.domain.recur.task.enums.Frequency;
import lombok.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import ch.noseryoung.domain.recur.task.enums.ReminderLeadTime;

// toBuilder=true wird gebraucht, um für die Response eine transiente Kopie
// mit maskierten Mitgliedern (siehe TaskService#maskMembers) zu bauen, ohne
// die verwaltete Entity selbst zu verändern (kein versehentliches Zurück-
// schreiben anonymisierter Namen in die echten Zuweisungs-/Archiv-Tabellen).
@Builder(toBuilder = true)
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

        // Zeitpunkt des letzten Fortschritts-Increments (Abhaken-Button /
        // "Als erledigt markieren") - Basis für die Rolling-Window-Sperre des
        // Abhaken-Buttons pro Frequenz-Intervall (#136). Wird bei resetProgress
        // wieder auf null gesetzt.
        @Column(name = "last_amount_did_at")
        private Instant lastAmountDidAt;

        // Completion-Historie pro Kalendertag (#152) - Source of Truth für
        // amountDid/progress/lastAmountDidAt, die daraus abgeleitet werden (siehe
        // TaskUtil#syncCompletions). Nur bei persönlichen Tasks genutzt (owner !=
        // null), Projekt-Tasks bleiben bei der bisherigen completedBy-Logik.
        @Builder.Default
        @ElementCollection
        @CollectionTable(name = "task_completion", joinColumns = @JoinColumn(name = "task_id"), uniqueConstraints = @UniqueConstraint(columnNames = {
                        "task_id", "completion_date" }))
        @Column(name = "completion_date")
        private Set<LocalDate> completions = new HashSet<>();

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

        // Transient, nicht die persistierte Task-Zeile: der Erinnerungs-Vorlauf
        // ist ein Override pro (Task, Empfänger) - siehe TaskReminderOverride -
        // nicht ein einzelner Wert für den ganzen (bei Projekt-Tasks geteilten)
        // Task. Wird von TaskService#maskMembers für den jeweiligen Betrachter
        // befüllt, bevor der Task in einer Response landet.
        @Transient
        private ReminderLeadTime reminderLeadTime;

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

        // Self-Service: Gruppenmitglieder können sich selbst einem geteilten
        // Projekt-Task zuweisen/abmelden (TaskService#assignSelf/unassignSelf).
        // Nur für Projekt-Tasks relevant.
        @Builder.Default
        @ManyToMany(fetch = FetchType.LAZY)
        @JoinTable(name = "task_assignee", joinColumns = @JoinColumn(name = "task_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
        private Set<User> assignedMembers = new HashSet<>();

        // Pro-Mitglied-Archiv-Status für geteilte Projekt-Tasks: ein zugewiesenes
        // Mitglied kann den Task "für sich" archivieren, ohne ihn für die
        // anderen zu schliessen. Sobald alle zugewiesenen Mitglieder enthalten
        // sind, wird isArchived automatisch global gesetzt (siehe
        // TaskService#applyArchivedChange).
        @Builder.Default
        @ManyToMany(fetch = FetchType.LAZY)
        @JoinTable(name = "task_archived_by", joinColumns = @JoinColumn(name = "task_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
        private Set<User> archivedBy = new HashSet<>();

        // Ersteller des Tasks - bei persönlichen Tasks identisch zu owner, bei
        // Projekt-Tasks der einzige, der ihn (nach dem Archivieren) für ALLE
        // Mitglieder endgültig löschen darf (siehe TaskService#deleteTask).
        // Bestandstasks von vor diesem Feld haben hier null - dort greift ein
        // Fallback auf den Gruppen-Admin (TaskService#isTaskCreator). Rein
        // serverseitig relevant, daher @JsonIgnore statt über maskMembers
        // anonymisiert zu werden wie assignedMembers/archivedBy.
        @JsonIgnore
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "created_by_id")
        private User createdBy;

        // Pro-Mitglied-Ausblenden für Projekt-Tasks: ein Nicht-Ersteller kann
        // einen archivierten Gruppen-Task im Archiv "löschen", ohne ihn für die
        // anderen zugewiesenen Mitglieder zu entfernen (TaskService#deleteTask).
        // Rückgängig machbar über PATCH ?hidden=false (Undo-Toast im Frontend).
        @JsonIgnore
        @Builder.Default
        @ManyToMany(fetch = FetchType.LAZY)
        @JoinTable(name = "task_hidden_for", joinColumns = @JoinColumn(name = "task_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
        private Set<User> hiddenFor = new HashSet<>();

        // Nur für den Cascade beim Löschen (#180): task_reminder_override
        // referenziert task_id per FK (nullable=false), sonst scheitert jeder
        // Delete-Pfad (deleteById, deleteByOwner, deleteByProjectIn) an der
        // Constraint. notification_log wird nicht mehr über eine JPA-Relation
        // hier mitgeräumt (task darf nicht von notification abhängen) -
        // stattdessen räumt TasksDeletedEvent das in notification auf, siehe
        // TaskService.
        @JsonIgnore
        @Builder.Default
        @OneToMany(mappedBy = "task", cascade = CascadeType.REMOVE)
        private List<TaskReminderOverride> reminderOverrides = new ArrayList<>();
}