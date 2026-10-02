package ch.noseryoung.domain.recur.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record DesktopExchangeRequest(
                @NotBlank(message = "Code ist erforderlich") String code,

                @NotBlank(message = "Verifier ist erforderlich") String verifier) {
}
