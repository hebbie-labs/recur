package ch.noseryoung.domain.recur.auth.security.jwt;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.auth.security.oauth2.PendingOAuth2Link;
import ch.noseryoung.domain.recur.user.enums.AuthProvider;
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

    private static final String PURPOSE_CLAIM = "purpose";
    private static final String OAUTH2_LINK_PURPOSE = "oauth2_link";

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
    // Tokens mit "purpose"-Claim (z.B. das OAuth2-Verknüpfungs-Token) sind nie
    // ein gültiger Access-Token - deren Inhaber hat den Account-Besitz ja
    // gerade noch NICHT nachgewiesen.
    public boolean isTokenValid(String token, String expectedEmail) {
        try {
            Claims claims = extractClaims(token);
            return claims.get(PURPOSE_CLAIM) == null
                    && claims.getSubject().equals(expectedEmail)
                    && claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // Kurzlebiges Token für den Verknüpfungs-Bestätigungsschritt (#236): trägt
    // nur, welche Provider-Identität mit welchem bestehenden Account verknüpft
    // werden soll. Subject ist bewusst keine E-Mail, damit es auch am
    // JwtAuthenticationFilter vorbei nie einen User auflöst.
    public String generateOAuth2LinkToken(PendingOAuth2Link link, Duration ttl) {
        Date now = new Date();
        return Jwts.builder()
                .subject(OAUTH2_LINK_PURPOSE)
                .claim(PURPOSE_CLAIM, OAUTH2_LINK_PURPOSE)
                .claim("userId", link.userId().toString())
                .claim("provider", link.provider().name())
                .claim("providerSubject", link.subjectId())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + ttl.toMillis()))
                .signWith(getSigningKey())
                .compact();
    }

    // Wirft JwtException/IllegalArgumentException bei ungültigem, abgelaufenem
    // oder zweckfremdem Token.
    public PendingOAuth2Link parseOAuth2LinkToken(String token) {
        Claims claims = extractClaims(token);
        if (!OAUTH2_LINK_PURPOSE.equals(claims.get(PURPOSE_CLAIM))) {
            throw new JwtException("Not an OAuth2 link token");
        }
        return new PendingOAuth2Link(
                UUID.fromString(claims.get("userId", String.class)),
                AuthProvider.valueOf(claims.get("provider", String.class)),
                claims.get("providerSubject", String.class));
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