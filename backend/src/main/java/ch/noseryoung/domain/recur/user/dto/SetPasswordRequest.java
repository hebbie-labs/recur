package ch.noseryoung.domain.recur.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SetPasswordRequest(
        @NotBlank(message = "Passwort ist erforderlich") @Size(min = 8, message = "Passwort muss mindestens 8 Zeichen lang sein") String password) {
}
