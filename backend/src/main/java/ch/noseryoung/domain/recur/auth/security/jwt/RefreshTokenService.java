package ch.noseryoung.domain.recur.auth.security.jwt;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.auth.exceptions.InvalidRefreshTokenException;
import ch.noseryoung.domain.recur.auth.model.RefreshToken;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.auth.repository.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletRequest;

@Service
public class RefreshTokenService {

    public static final String COOKIE_NAME = "refresh_token";
    private static final String COOKIE_PATH = "/api/auth";

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public record RotationResult(String rawToken, User user) {
    }

    // Login/Register/OAuth2-Erfolg: startet eine neue Session (neue sessionId).
    public String issue(User user, HttpServletRequest request) {
        return issue(user, UUID.randomUUID(), request);
    }

    // Rotiert ein gültiges Refresh-Token: die alte Zeile wird revoked, eine neue
    // mit derselben sessionId und neuem 30-Tage-Ablauf ersetzt sie (sliding
    // expiration). Reuse einer bereits revoked Zeile ist ein Diebstahl-Signal ->
    // nur diese eine Session wird revoked, nicht alle Sessions des Users.
    @Transactional
    public RotationResult rotate(String rawToken, HttpServletRequest request) {
        RefreshToken existing = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(InvalidRefreshTokenException::new);

        if (Boolean.TRUE.equals(existing.getRevoked())) {
            refreshTokenRepository.revokeActiveBySessionId(existing.getSessionId());
            throw new InvalidRefreshTokenException();
        }

        if (existing.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidRefreshTokenException();
        }

        existing.setRevoked(true);
        refreshTokenRepository.save(existing);

        String newRawToken = issue(existing.getUser(), existing.getSessionId(), request);
        return new RotationResult(newRawToken, existing.getUser());
    }

    // Logout: best-effort, unbekanntes/bereits ungültiges Token ist kein Fehler.
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(hash(rawToken))
                .ifPresent(t -> {
                    t.setRevoked(true);
                    refreshTokenRepository.save(t);
                });
    }

    public void deleteAllForUser(UUID userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    public ResponseCookie buildCookie(String rawToken, HttpServletRequest request) {
        return ResponseCookie.from(COOKIE_NAME, rawToken)
                .httpOnly(true)
                .secure(request.isSecure())
                .path(COOKIE_PATH)
                .maxAge(Duration.ofMillis(refreshExpirationMs))
                .sameSite("Lax")
                .build();
    }

    public ResponseCookie buildExpiredCookie(HttpServletRequest request) {
        return ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(request.isSecure())
                .path(COOKIE_PATH)
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }

    private String issue(User user, UUID sessionId, HttpServletRequest request) {
        String rawToken = UUID.randomUUID().toString();

        RefreshToken token = RefreshToken.builder()
                .sessionId(sessionId)
                .user(user)
                .tokenHash(hash(rawToken))
                .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
                .ipAddress(request.getRemoteAddr())
                .userAgent(request.getHeader("User-Agent"))
                .build();
        refreshTokenRepository.save(token);

        return rawToken;
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
