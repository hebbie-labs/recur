package ch.noseryoung.domain.recur.notification.service;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ch.noseryoung.domain.recur.notification.repository.PushSubscriptionRepository;
import ch.noseryoung.domain.recur.user.model.User;

/**
 * Deckt die "optionales Feature"-Regel von PushNotificationService ab (siehe
 * Klassenkommentar): ohne konfigurierte VAPID-Keys (z.B. lokale Entwicklung
 * ohne VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY) bleibt der Versand still
 * deaktiviert statt den Anwendungsstart zu verhindern oder beim Versand eine
 * Exception zu werfen. sendToUser() darf dabei nicht einmal die Subscriptions
 * des Users laden.
 */
@ExtendWith(MockitoExtension.class)
class PushNotificationServiceTest {

    @Mock
    private PushSubscriptionRepository pushSubscriptionRepository;

    private User user;

    @Test
    void sendToUser_doesNothingWhenVapidKeysAreBlank() {
        PushNotificationService service = new PushNotificationService(pushSubscriptionRepository, "", "", "mailto:test@example.com");
        user = User.builder().id(UUID.randomUUID()).build();

        service.sendToUser(user, "Titel", "Text");

        verify(pushSubscriptionRepository, never()).findByUser(user);
    }

    @Test
    void sendToUser_doesNothingWhenVapidKeysAreNull() {
        PushNotificationService service = new PushNotificationService(pushSubscriptionRepository, null, null, "mailto:test@example.com");
        user = User.builder().id(UUID.randomUUID()).build();

        service.sendToUser(user, "Titel", "Text");

        verify(pushSubscriptionRepository, never()).findByUser(user);
    }

    @Test
    void sendToUser_doesNothingWhenOnlyPrivateKeyIsMissing() {
        PushNotificationService service = new PushNotificationService(pushSubscriptionRepository,
                "some-public-key", "", "mailto:test@example.com");
        user = User.builder().id(UUID.randomUUID()).build();

        service.sendToUser(user, "Titel", "Text");

        verify(pushSubscriptionRepository, never()).findByUser(user);
    }
}
