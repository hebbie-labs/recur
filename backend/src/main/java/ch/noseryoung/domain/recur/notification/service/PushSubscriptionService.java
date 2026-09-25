package ch.noseryoung.domain.recur.notification.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.service.CurrentUserService;
import ch.noseryoung.domain.recur.notification.dto.PushSubscriptionRequest;
import ch.noseryoung.domain.recur.notification.model.PushSubscription;
import ch.noseryoung.domain.recur.notification.repository.PushSubscriptionRepository;

@Service
public class PushSubscriptionService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final CurrentUserService currentUserService;
    private final String vapidPublicKey;

    public PushSubscriptionService(PushSubscriptionRepository pushSubscriptionRepository,
            CurrentUserService currentUserService,
            @Value("${app.push.vapid-public-key}") String vapidPublicKey) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.currentUserService = currentUserService;
        this.vapidPublicKey = vapidPublicKey;
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }

    // Idempotent: derselbe Browser kann sich mehrfach re-subscriben (z.B. nach
    // erneutem Aktivieren des Toggles), der endpoint ist dabei stabil.
    public void subscribe(PushSubscriptionRequest request) {
        User user = currentUserService.get();

        PushSubscription subscription = pushSubscriptionRepository.findByEndpoint(request.endpoint())
                .orElseGet(() -> PushSubscription.builder().endpoint(request.endpoint()).build());

        subscription.setUser(user);
        subscription.setP256dhKey(request.keys().p256dh());
        subscription.setAuthKey(request.keys().auth());

        pushSubscriptionRepository.save(subscription);
    }

    // deleteByEndpoint is a derived delete query (load+remove under the
    // hood) - needs an active transaction, or Hibernate throws
    // TransactionRequiredException.
    @Transactional
    public void unsubscribe(String endpoint) {
        pushSubscriptionRepository.deleteByEndpoint(endpoint);
    }
}
