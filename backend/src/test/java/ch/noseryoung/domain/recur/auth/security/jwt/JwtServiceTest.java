package ch.noseryoung.domain.recur.auth.security.jwt;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import ch.noseryoung.domain.recur.user.model.User;

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
}
