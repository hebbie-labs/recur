package ch.noseryoung.domain.recur.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
                @NotBlank(message = "E-Mail ist erforderlich") @Email(message = "E-Mail muss gültig sein") String email,

                @NotBlank(message = "Passwort ist erforderlich") @Size(min = 8, message = "Passwort muss mindestens 8 Zeichen lang sein") String password,

                @NotBlank(message = "Vorname ist erforderlich") String firstName,

                String lastName) {
}