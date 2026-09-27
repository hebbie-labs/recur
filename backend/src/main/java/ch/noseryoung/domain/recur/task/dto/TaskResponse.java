package ch.noseryoung.domain.recur.task.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

import ch.noseryoung.domain.recur.group.model.Project;
import ch.noseryoung.domain.recur.task.enums.Category;
import ch.noseryoung.domain.recur.task.enums.Frequency;
import ch.noseryoung.domain.recur.task.enums.ReminderLeadTime;
import ch.noseryoung.domain.recur.task.model.Task;
import ch.noseryoung.domain.recur.user.dto.UserSummary;

// Ersetzt die direkte Serialisierung von Task: kein owner (vom Frontend nie
// genutzt), completedBy/assignedMembers/archivedBy als UserSummary statt
// volles User-Objekt (siehe TaskService#toResponse für die Maskierung).
//
// @JsonProperty auf den beiden boolean-Feldern ist nötig, weil Jackson einen
// Record-Accessor namens isFavorite()/isArchived() sonst wie einen
// Bean-is-Getter behandelt und "is" fälschlich abschneidet (Property würde
// sonst "favorite"/"archived" statt "isFavorite"/"isArchived" heissen).
public record TaskResponse(
        UUID id,
        String name,
        Category category,
        Frequency frequency,
        String description,
        Instant dateUntil,
        Double progress,
        Instant dateCreated,
        Instant updatedAt,
        Integer daysInSpan,
        Integer amountDid,
        Instant lastAmountDidAt,
        Set<LocalDate> completions,
        @JsonProperty("isFavorite") Boolean isFavorite,
        @JsonProperty("isArchived") Boolean isArchived,
        Integer durationMinutes,
        Instant startTime,
        ReminderLeadTime reminderLeadTime,
        ProjectSummary project,
        UserSummary completedBy,
        Set<UserSummary> assignedMembers,
        Set<UserSummary> archivedBy) {

    public record ProjectSummary(
            UUID id,
            String name,
            Instant dateCreated,
            @JsonProperty("isArchived") Boolean isArchived) {

        public static ProjectSummary from(Project project) {
            if (project == null) {
                return null;
            }
            return new ProjectSummary(project.getId(), project.getName(), project.getDateCreated(),
                    project.getIsArchived());
        }
    }

    public static TaskResponse from(Task task, ReminderLeadTime reminderLeadTime, ProjectSummary project,
            UserSummary completedBy, Set<UserSummary> assignedMembers, Set<UserSummary> archivedBy) {
        return new TaskResponse(
                task.getId(),
                task.getName(),
                task.getCategory(),
                task.getFrequency(),
                task.getDescription(),
                task.getDateUntil(),
                task.getProgress(),
                task.getDateCreated(),
                task.getUpdatedAt(),
                task.getDaysInSpan(),
                task.getAmountDid(),
                task.getLastAmountDidAt(),
                task.getCompletions(),
                task.getIsFavorite(),
                task.getIsArchived(),
                task.getDurationMinutes(),
                task.getStartTime(),
                reminderLeadTime,
                project,
                completedBy,
                assignedMembers,
                archivedBy);
    }
}
