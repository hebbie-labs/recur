package ch.noseryoung.domain.recur.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
                @NotBlank(message = "E-Mail ist erforderlich") @Email(message = "E-Mail muss gültig sein") String email,

                @NotBlank(message = "Passwort ist erforderlich") String password) {
}