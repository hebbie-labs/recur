package ch.noseryoung.domain.recur.notification.service;

import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.List;

import org.apache.http.HttpResponse;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.notification.model.PushSubscription;
import ch.noseryoung.domain.recur.notification.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;

@Service
public class PushNotificationService {

    private static final Logger logger = LogManager.getLogger(PushNotificationService.class);

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final PushService pushService;

    // Ohne konfigurierte VAPID-Keys (z.B. lokale Entwicklung ohne
    // VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY) bleibt pushService null und der
    // Versand wird still übersprungen - web-push-java's Konstruktor würde bei
    // leeren/ungültigen Keys eine GeneralSecurityException werfen und damit
    // den kompletten Anwendungsstart verhindern, was für ein optionales
    // Feature zu viel verlangt ist (Analogon: BREVO_API_KEY ist ebenfalls
    // optional, siehe EmailService).
    public PushNotificationService(
            PushSubscriptionRepository pushSubscriptionRepository,
            @Value("${app.push.vapid-public-key}") String vapidPublicKey,
            @Value("${app.push.vapid-private-key}") String vapidPrivateKey,
            @Value("${app.push.vapid-subject}") String vapidSubject) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.pushService = buildPushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
    }

    private static PushService buildPushService(String publicKey, String privateKey, String subject) {
        if (publicKey == null || publicKey.isBlank() || privateKey == null || privateKey.isBlank()) {
            logger.warn("VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not configured - push notifications are disabled");
            return null;
        }

        try {
            Security.addProvider(new BouncyCastleProvider());
            return new PushService(publicKey, privateKey, subject);
        } catch (GeneralSecurityException e) {
            logger.error("Failed to initialize web push service - push notifications are disabled", e);
            return null;
        }
    }

    public void sendToUser(User user, String title, String body) {
        if (pushService == null) {
            return;
        }

        List<PushSubscription> subscriptions = pushSubscriptionRepository.findByUser(user);
        String payload = "{\"title\":\"" + escapeJson(title) + "\",\"body\":\"" + escapeJson(body) + "\"}";

        subscriptions.forEach(subscription -> trySend(subscription, payload));
    }

    // Der Browser liefert bei Ungültigkeit/Widerruf 404/410 zurück - danach
    // würde jeder künftige Versand an dieselbe Subscription erneut fehlschlagen,
    // sie wird also entfernt statt erneut versucht.
    private void trySend(PushSubscription subscription, String payload) {
        try {
            Subscription webPushSubscription = new Subscription(subscription.getEndpoint(),
                    new Subscription.Keys(subscription.getP256dhKey(), subscription.getAuthKey()));

            HttpResponse response = pushService
                    .send(new Notification(webPushSubscription, payload));

            int status = response.getStatusLine().getStatusCode();
            if (status == 404 || status == 410) {
                pushSubscriptionRepository.deleteByEndpoint(subscription.getEndpoint());
            }
        } catch (Exception e) {
            // web-push-java's send() bündelt Krypto-/HTTP-/JOSE-Fehler in
            // mehreren unabhängigen Checked-Exception-Typen - keiner davon
            // darf den Aufrufer (Scheduler, Task-Erstellung) crashen lassen.
            logger.error("Failed to send push notification to {}", subscription.getEndpoint(), e);
        }
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
