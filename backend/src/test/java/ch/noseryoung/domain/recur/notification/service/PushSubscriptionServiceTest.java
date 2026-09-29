package ch.noseryoung.domain.recur.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ch.noseryoung.domain.recur.notification.dto.PushSubscriptionRequest;
import ch.noseryoung.domain.recur.notification.model.PushSubscription;
import ch.noseryoung.domain.recur.notification.repository.PushSubscriptionRepository;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.service.CurrentUserService;

/**
 * Deckt die Idempotenz von PushSubscriptionService#subscribe ab: derselbe
 * Browser-Endpoint darf sich mehrfach re-subscriben (z.B. nach erneutem
 * Aktivieren des Toggles) ohne Duplikate anzulegen, und die Keys/der User
 * einer bestehenden Subscription werden dabei aktualisiert statt einer neuen
 * Zeile.
 */
@ExtendWith(MockitoExtension.class)
class PushSubscriptionServiceTest {

    @Mock
    private PushSubscriptionRepository pushSubscriptionRepository;

    @Mock
    private CurrentUserService currentUserService;

    private PushSubscriptionService pushSubscriptionService;
    private User user;

    @BeforeEach
    void setUp() {
        pushSubscriptionService = new PushSubscriptionService(pushSubscriptionRepository, currentUserService,
                "test-vapid-public-key");

        user = User.builder().id(UUID.randomUUID()).email("user@example.com").build();
    }

    @Test
    void getVapidPublicKey_returnsConfiguredKey() {
        assertThat(pushSubscriptionService.getVapidPublicKey()).isEqualTo("test-vapid-public-key");
    }

    @Test
    void subscribe_createsNewSubscriptionWhenEndpointUnknown() {
        when(currentUserService.get()).thenReturn(user);
        PushSubscriptionRequest request = new PushSubscriptionRequest("https://push.example/abc",
                new PushSubscriptionRequest.Keys("p256dh-key", "auth-key"));
        when(pushSubscriptionRepository.findByEndpoint(request.endpoint())).thenReturn(Optional.empty());

        pushSubscriptionService.subscribe(request);

        ArgumentCaptor<PushSubscription> captor = ArgumentCaptor.forClass(PushSubscription.class);
        verify(pushSubscriptionRepository).save(captor.capture());
        PushSubscription saved = captor.getValue();
        assertThat(saved.getEndpoint()).isEqualTo(request.endpoint());
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(saved.getP256dhKey()).isEqualTo("p256dh-key");
        assertThat(saved.getAuthKey()).isEqualTo("auth-key");
    }

    @Test
    void subscribe_updatesExistingSubscriptionForSameEndpointInsteadOfDuplicating() {
        when(currentUserService.get()).thenReturn(user);
        PushSubscription existing = PushSubscription.builder()
                .id(UUID.randomUUID())
                .endpoint("https://push.example/abc")
                .p256dhKey("old-p256dh")
                .authKey("old-auth")
                .build();
        PushSubscriptionRequest request = new PushSubscriptionRequest(existing.getEndpoint(),
                new PushSubscriptionRequest.Keys("new-p256dh", "new-auth"));
        when(pushSubscriptionRepository.findByEndpoint(request.endpoint())).thenReturn(Optional.of(existing));

        pushSubscriptionService.subscribe(request);

        assertThat(existing.getUser()).isEqualTo(user);
        assertThat(existing.getP256dhKey()).isEqualTo("new-p256dh");
        assertThat(existing.getAuthKey()).isEqualTo("new-auth");
        verify(pushSubscriptionRepository).save(existing);
    }

    @Test
    void unsubscribe_deletesByEndpoint() {
        pushSubscriptionService.unsubscribe("https://push.example/abc");

        verify(pushSubscriptionRepository).deleteByEndpoint("https://push.example/abc");
    }
}
