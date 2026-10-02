package ch.noseryoung.domain.recur.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.auth.exceptions.DesktopLoginCodeInvalidException;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.repository.UserRepository;

// Brücke für den OAuth-Login der Desktop-App: Der Provider-Login läuft im
// Systembrowser, die Cookies landen dort - die Desktop-App kommt aber nie an
// sie heran. Deshalb gibt der OAuth2AuthenticationSuccessHandler hier einen
// Einmal-Code aus, den der Browser per recur://auth?code=... an die App
// weiterreicht und die App gegen ihre eigene Session eintauscht.
//
// Schutz davor, dass ein anderes Programm, das sich ebenfalls für recur://
// registriert, den Code abfängt (PKCE-Prinzip, RFC 7636): Die App erzeugt vor
// dem Login einen zufälligen Verifier und schickt nur dessen SHA-256 (die
// "Challenge") mit. Der Code ist an diese Challenge gebunden und nur zusammen
// mit dem passenden Verifier einlösbar, den nur die App kennt.
//
// Bewusst im Speicher statt in der DB: Codes leben nur 60 Sekunden. Das
// setzt eine einzelne Backend-Instanz voraus (wie der aktuelle Deploy) -
// bei mehreren Instanzen müsste der Speicher geteilt werden.
@Service
public class DesktopLoginCodeService {

    static final Duration CODE_TTL = Duration.ofSeconds(60);

    private static final int CODE_BYTES = 32;

    // Base64url ohne Padding von SHA-256 (32 Byte) ist immer 43 Zeichen lang.
    private static final Pattern CHALLENGE_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{43}$");

    // Wie bei PKCE: 43-128 Zeichen aus dem unreserved-Alphabet.
    private static final Pattern VERIFIER_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{43,128}$");

    private record PendingCode(UUID userId, String challenge, Instant expiresAt) {
    }

    private final Map<String, PendingCode> pending = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    private final UserRepository userRepository;
    private final Clock clock;

    @Autowired
    public DesktopLoginCodeService(UserRepository userRepository) {
        this(userRepository, Clock.systemUTC());
    }

    DesktopLoginCodeService(UserRepository userRepository, Clock clock) {
        this.userRepository = userRepository;
        this.clock = clock;
    }

    public static boolean isValidChallenge(String challenge) {
        return challenge != null && CHALLENGE_PATTERN.matcher(challenge).matches();
    }

    public String issue(User user, String challenge) {
        if (!isValidChallenge(challenge)) {
            throw new IllegalArgumentException("Invalid desktop login challenge");
        }

        purgeExpired();

        byte[] bytes = new byte[CODE_BYTES];
        secureRandom.nextBytes(bytes);
        String code = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        pending.put(code, new PendingCode(user.getId(), challenge, clock.instant().plus(CODE_TTL)));
        return code;
    }

    // remove() statt get(): Der Code ist auch bei falschem Verifier verbraucht.
    // So kann ein Angreifer, der den Code kennt, nicht beliebig viele
    // Verifier durchprobieren. Alle Fehlerfälle liefern dieselbe Exception,
    // damit sich "abgelaufen", "falscher Verifier" und "unbekannt" von außen
    // nicht unterscheiden lassen.
    public User redeem(String code, String verifier) {
        PendingCode entry = code == null ? null : pending.remove(code);

        if (entry == null
                || clock.instant().isAfter(entry.expiresAt())
                || verifier == null
                || !VERIFIER_PATTERN.matcher(verifier).matches()
                || !challengeMatches(entry.challenge(), verifier)) {
            throw new DesktopLoginCodeInvalidException();
        }

        return userRepository.findById(entry.userId()).orElseThrow(DesktopLoginCodeInvalidException::new);
    }

    private void purgeExpired() {
        Instant now = clock.instant();
        pending.values().removeIf(entry -> now.isAfter(entry.expiresAt()));
    }

    private static boolean challengeMatches(String challenge, String verifier) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(verifier.getBytes(StandardCharsets.US_ASCII));
            String computed = Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
            // Konstante Laufzeit, damit der Vergleich nichts über den Verifier verrät.
            return MessageDigest.isEqual(
                    computed.getBytes(StandardCharsets.US_ASCII),
                    challenge.getBytes(StandardCharsets.US_ASCII));
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 muss laut Java-Spezifikation jede JVM mitbringen.
            throw new IllegalStateException(e);
        }
    }
}
