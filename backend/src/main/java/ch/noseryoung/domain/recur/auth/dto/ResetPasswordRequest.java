package ch.noseryoung.domain.recur.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
                @NotBlank(message = "Token ist erforderlich") String token,

                @NotBlank(message = "Passwort ist erforderlich") @Size(min = 8, message = "Passwort muss mindestens 8 Zeichen lang sein") String newPassword) {
}
