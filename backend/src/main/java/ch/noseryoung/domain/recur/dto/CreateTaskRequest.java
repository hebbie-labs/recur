package ch.noseryoung.domain.recur.dto;

import java.time.Instant;

import ch.noseryoung.domain.recur.enums.Category;
import ch.noseryoung.domain.recur.enums.Frequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTaskRequest(
                @NotBlank(message = "Name ist erforderlich") @Size(min = 2, max = 40, message = "Name muss zwischen 2 und 40 Zeichen lang sein") String name,

                @NotNull(message = "Kategorie ist erforderlich") Category category,

                @NotNull(message = "Frequenz ist erforderlich") Frequency frequency,

                @NotBlank(message = "Beschreibung ist erforderlich") @Size(max = 200, message = "Beschreibung darf maximal 200 Zeichen lang sein") String description,

                @NotNull(message = "Fälligkeitsdatum ist erforderlich") Instant dateUntil,

                Integer durationMinutes,

                Instant startTime,

                ProjectReference project) {
}
