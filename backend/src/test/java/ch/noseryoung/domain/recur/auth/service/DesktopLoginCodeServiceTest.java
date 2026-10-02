package ch.noseryoung.domain.recur.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ch.noseryoung.domain.recur.auth.exceptions.DesktopLoginCodeInvalidException;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.repository.UserRepository;

/**
 * Deckt die Sicherheitseigenschaften des Desktop-Login-Codes ab: Einmaligkeit,
 * Bindung an den Verifier (PKCE-Prinzip) und Ablauf nach 60 Sekunden.
 */
@ExtendWith(MockitoExtension.class)
class DesktopLoginCodeServiceTest {

    private static final String VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

    @Mock
    private UserRepository userRepository;

    private MutableClock clock;
    private DesktopLoginCodeService service;
    private User user;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-10-02T12:00:00Z"));
        service = new DesktopLoginCodeService(userRepository, clock);

        user = new User();
        user.setId(UUID.randomUUID());
        lenient().when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
    }

    @Test
    void redeem_withMatchingVerifier_returnsTheUser() {
        String code = service.issue(user, challengeOf(VERIFIER));

        assertThat(service.redeem(code, VERIFIER)).isSameAs(user);
    }

    @Test
    void redeem_secondTime_isRejected() {
        String code = service.issue(user, challengeOf(VERIFIER));
        service.redeem(code, VERIFIER);

        assertThatThrownBy(() -> service.redeem(code, VERIFIER))
                .isInstanceOf(DesktopLoginCodeInvalidException.class);
    }

    @Test
    void redeem_withWrongVerifier_isRejectedAndBurnsTheCode() {
        String code = service.issue(user, challengeOf(VERIFIER));
        String otherVerifier = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

        assertThatThrownBy(() -> service.redeem(code, otherVerifier))
                .isInstanceOf(DesktopLoginCodeInvalidException.class);

        // Auch der richtige Verifier hilft danach nicht mehr: sonst könnte man
        // einen abgefangenen Code durch Raten des Verifiers eintauschen.
        assertThatThrownBy(() -> service.redeem(code, VERIFIER))
                .isInstanceOf(DesktopLoginCodeInvalidException.class);
    }

    @Test
    void redeem_afterTtl_isRejected() {
        String code = service.issue(user, challengeOf(VERIFIER));
        clock.advance(DesktopLoginCodeService.CODE_TTL.plusSeconds(1));

        assertThatThrownBy(() -> service.redeem(code, VERIFIER))
                .isInstanceOf(DesktopLoginCodeInvalidException.class);
    }

    @Test
    void redeem_exactlyAtTtl_stillWorks() {
        String code = service.issue(user, challengeOf(VERIFIER));
        clock.advance(DesktopLoginCodeService.CODE_TTL);

        assertThat(service.redeem(code, VERIFIER)).isSameAs(user);
    }

    @Test
    void redeem_withUnknownOrMalformedInput_isRejected() {
        assertThatThrownBy(() -> service.redeem("unknown", VERIFIER))
                .isInstanceOf(DesktopLoginCodeInvalidException.class);
        assertThatThrownBy(() -> service.redeem(null, VERIFIER))
                .isInstanceOf(DesktopLoginCodeInvalidException.class);

        String code = service.issue(user, challengeOf(VERIFIER));
        assertThatThrownBy(() -> service.redeem(code, null))
                .isInstanceOf(DesktopLoginCodeInvalidException.class);
    }

    @Test
    void issue_returnsDifferentCodesEachTime() {
        String challenge = challengeOf(VERIFIER);

        assertThat(service.issue(user, challenge)).isNotEqualTo(service.issue(user, challenge));
    }

    @Test
    void issue_withInvalidChallenge_throws() {
        assertThatThrownBy(() -> service.issue(user, "too-short"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.issue(user, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void isValidChallenge_acceptsOnlyBase64UrlOf43Chars() {
        assertThat(DesktopLoginCodeService.isValidChallenge(challengeOf(VERIFIER))).isTrue();
        assertThat(DesktopLoginCodeService.isValidChallenge(null)).isFalse();
        assertThat(DesktopLoginCodeService.isValidChallenge("")).isFalse();
        assertThat(DesktopLoginCodeService.isValidChallenge("a".repeat(44))).isFalse();
        assertThat(DesktopLoginCodeService.isValidChallenge("a".repeat(42) + "=")).isFalse();
        assertThat(DesktopLoginCodeService.isValidChallenge("a".repeat(42) + "/")).isFalse();
    }

    // Gleiche Berechnung wie in der Desktop-App (SHA-256, Base64url ohne Padding).
    private static String challengeOf(String verifier) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(verifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant start) {
            this.now = start;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
