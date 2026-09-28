package ch.noseryoung.domain.recur.group.model;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
@Table(name = "project")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @NotBlank(message = "Name ist erforderlich")
    @Size(min = 2, max = 60, message = "Name muss zwischen 2 und 60 Zeichen lang sein")
    @Column(name = "name")
    private String name;

    @CreationTimestamp
    @Column(name = "date_created", updatable = false)
    private Instant dateCreated;

    @Builder.Default
    @Column(name = "is_archived", nullable = false, columnDefinition = "boolean default false")
    private Boolean isArchived = false;

    // @JsonIgnore, damit ein Task, der dieses Projekt referenziert, nicht die
    // ganze Gruppe (inkl. Mitgliederliste) mitschickt - Gruppendetails werden
    // über die eigenen Group-Endpunkte abgefragt.
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private TaskGroup group;
}
