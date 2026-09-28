package ch.noseryoung.domain.recur.auth.security.jwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import ch.noseryoung.domain.recur.auth.security.oauth2.PendingOAuth2Link;
import ch.noseryoung.domain.recur.user.enums.AuthProvider;
import ch.noseryoung.domain.recur.user.model.User;
import io.jsonwebtoken.JwtException;

/**
 * Deckt Token-Ausstellung und -Validierung ab - das Fundament der
 * zustandslosen Authentifizierung (JwtAuthenticationFilter vertraut
 * ausschliesslich auf isTokenValid()).
 */
class JwtServiceTest {

    private static final String TEST_SECRET = "test-secret-key-for-jwt-signing-must-be-long-enough-1234567890";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "expirationMs", 3_600_000L);
    }

    private User testUser() {
        return User.builder().id(UUID.randomUUID()).email("user@example.com").build();
    }

    @Test
    void generateToken_producesTokenValidForItsOwnUser() {
        User user = testUser();

        String token = jwtService.generateToken(user);

        assertThat(jwtService.isTokenValid(token, user.getEmail())).isTrue();
        assertThat(jwtService.extractEmail(token)).isEqualTo(user.getEmail());
    }

    @Test
    void isTokenValid_rejectsMismatchedEmail() {
        String token = jwtService.generateToken(testUser());

        assertThat(jwtService.isTokenValid(token, "someone-else@example.com")).isFalse();
    }

    @Test
    void isTokenValid_rejectsExpiredToken() {
        ReflectionTestUtils.setField(jwtService, "expirationMs", -1_000L);
        User user = testUser();

        String token = jwtService.generateToken(user);

        assertThat(jwtService.isTokenValid(token, user.getEmail())).isFalse();
    }

    @Test
    void isTokenValid_rejectsTamperedToken() {
        String token = jwtService.generateToken(testUser());
        String tampered = token.substring(0, token.length() - 1) + (token.endsWith("a") ? "b" : "a");

        assertThat(jwtService.isTokenValid(tampered, "user@example.com")).isFalse();
    }

    @Test
    void isTokenValid_rejectsGarbageInput() {
        assertThat(jwtService.isTokenValid("not-a-jwt", "user@example.com")).isFalse();
    }

    @Test
    void oauth2LinkToken_roundTripsPendingLink() {
        PendingOAuth2Link link = new PendingOAuth2Link(UUID.randomUUID(), AuthProvider.GITHUB, "12345");

        String token = jwtService.generateOAuth2LinkToken(link, Duration.ofMinutes(10));

        assertThat(jwtService.parseOAuth2LinkToken(token)).isEqualTo(link);
    }

    // #236: wer das Verknüpfungs-Token hat, hat den Account-Besitz noch NICHT
    // nachgewiesen - es darf nie als Access-Token durchgehen.
    @Test
    void oauth2LinkToken_isNeverAValidAccessToken() {
        String token = jwtService.generateOAuth2LinkToken(
                new PendingOAuth2Link(UUID.randomUUID(), AuthProvider.GOOGLE, "sub"), Duration.ofMinutes(10));

        assertThat(jwtService.isTokenValid(token, jwtService.extractEmail(token))).isFalse();
    }

    @Test
    void parseOAuth2LinkToken_rejectsAccessToken() {
        String accessToken = jwtService.generateToken(testUser());

        assertThatThrownBy(() -> jwtService.parseOAuth2LinkToken(accessToken))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void parseOAuth2LinkToken_rejectsExpiredToken() {
        String token = jwtService.generateOAuth2LinkToken(
                new PendingOAuth2Link(UUID.randomUUID(), AuthProvider.GOOGLE, "sub"), Duration.ofSeconds(-1));

        assertThatThrownBy(() -> jwtService.parseOAuth2LinkToken(token))
                .isInstanceOf(JwtException.class);
    }
}
