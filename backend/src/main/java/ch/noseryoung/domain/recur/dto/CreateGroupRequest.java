package ch.noseryoung.domain.recur.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateGroupRequest(
                @NotBlank(message = "Name ist erforderlich") @Size(min = 2, max = 60, message = "Name muss zwischen 2 und 60 Zeichen lang sein") String name) {
}
