package ch.noseryoung.domain.recur.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResendVerificationRequest(
                @NotBlank(message = "E-Mail ist erforderlich") @Email(message = "E-Mail muss gültig sein") String email) {
}
