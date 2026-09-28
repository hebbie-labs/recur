package ch.noseryoung.domain.recur.auth.security.jwt;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.user.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;

@Service
public class JwtService {

    // HttpOnly-Cookie statt Authorization-Header (#160) - liest XSS-exponierten
    // JWT nicht mehr aus dem localStorage. Pfad /api statt nur /api/auth, da
    // jeder authentifizierte Endpunkt den Access-Token braucht.
    public static final String COOKIE_NAME = "access_token";
    private static final String COOKIE_PATH = "/api";

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId().toString())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    // Prüft Signatur, Ablaufdatum und ob das Token zum übergebenen User gehört.
    public boolean isTokenValid(String token, String expectedEmail) {
        try {
            Claims claims = extractClaims(token);
            return claims.getSubject().equals(expectedEmail) && claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public ResponseCookie buildCookie(String token, HttpServletRequest request) {
        return ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(request.isSecure())
                .path(COOKIE_PATH)
                .maxAge(Duration.ofMillis(expirationMs))
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

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}