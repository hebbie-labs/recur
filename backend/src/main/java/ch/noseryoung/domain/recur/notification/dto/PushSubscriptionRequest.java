package ch.noseryoung.domain.recur.notification.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// Deckt sich mit dem, was PushSubscription.toJSON() im Browser liefert
// (siehe Push API) - direkt vom Frontend nach erfolgreichem
// pushManager.subscribe(...) an POST /api/push/subscriptions geschickt.
public record PushSubscriptionRequest(
        @NotBlank String endpoint,
        @NotNull @Valid Keys keys) {

    public record Keys(
            @NotBlank String p256dh,
            @NotBlank String auth) {
    }
}
