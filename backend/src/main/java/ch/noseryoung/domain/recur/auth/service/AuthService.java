package ch.noseryoung.domain.recur.auth.service;

import java.time.Instant;
import java.util.UUID;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import ch.noseryoung.domain.recur.auth.dto.AuthResponse;
import ch.noseryoung.domain.recur.auth.dto.LoginRequest;
import ch.noseryoung.domain.recur.auth.dto.RegisterRequest;
import ch.noseryoung.domain.recur.user.dto.UserResponse;
import ch.noseryoung.domain.recur.user.enums.AuthProvider;
import ch.noseryoung.domain.recur.auth.enums.VerificationStatus;
import ch.noseryoung.domain.recur.auth.exceptions.EmailAlreadyExistsException;
import ch.noseryoung.domain.recur.auth.exceptions.InvalidCredentialsException;
import ch.noseryoung.domain.recur.auth.exceptions.InvalidPasswordResetTokenException;
import ch.noseryoung.domain.recur.auth.model.PasswordResetToken;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.auth.model.VerificationToken;
import ch.noseryoung.domain.recur.auth.repository.PasswordResetTokenRepository;
import ch.noseryoung.domain.recur.shared.service.EmailService;
import ch.noseryoung.domain.recur.user.event.UserDeletedEvent;
import ch.noseryoung.domain.recur.user.repository.UserRepository;
import ch.noseryoung.domain.recur.auth.repository.VerificationTokenRepository;
import ch.noseryoung.domain.recur.auth.security.jwt.JwtService;
import ch.noseryoung.domain.recur.auth.security.jwt.RefreshTokenService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuthService {

    private static final Logger logger = LogManager.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;

    // Bündelt die AuthResponse (User, geht in den Response-Body) mit dem rohen
    // Access- und Refresh-Token (beide gehen als HttpOnly-Cookies raus, #160) -
    // der Controller baut daraus die Set-Cookie-Header, der Service kennt keine
    // HTTP-Response.
    public record AuthResult(AuthResponse authResponse, String accessToken, String refreshToken) {
    }

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.mail.verification-expiry-hours}")
    private long verificationExpiryHours;

    @Value("${app.mail.resend-cooldown-seconds}")
    private long resendCooldownSeconds;

    @Value("${app.mail.password-reset-expiry-hours}")
    private long passwordResetExpiryHours;

    @Value("${app.mail.password-reset-cooldown-seconds}")
    private long passwordResetCooldownSeconds;

    public AuthService(UserRepository userRepository,
            VerificationTokenRepository verificationTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder, JwtService jwtService, RefreshTokenService refreshTokenService,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.emailService = emailService;
    }

    // E-Mail-Verifizierung ist temporär umgangen (#128): die Absenderdomain ist
    // auf der Spamhaus DBL gelistet (#126), Verifizierungs-Mails kommen nie an.
    // Registrierung loggt deshalb wie vor #110 direkt ein statt eine Mail zu
    // verschicken, die niemand je bestätigen könnte. issueVerificationToken
    // bleibt unangetastet für die Reaktivierung nach der Domain-Migration.
    public AuthResult register(RegisterRequest request, HttpServletRequest httpRequest) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .provider(AuthProvider.LOCAL)
                .emailVerified(true)
                .build();

        userRepository.save(user);

        return authResult(user, httpRequest);
    }

    public AuthResult login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);

        // Kein passwordHash -> Konto wurde nur über Google angelegt, es existiert
        // kein lokales Passwort, gegen das geprüft werden könnte.
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        // Verifizierungs-Check temporär deaktiviert (#128, siehe register()
        // oben) - erfasst auch Alt-Konten, die vor dieser Änderung registriert
        // wurden und nie eine Verifizierungs-Mail erhalten konnten.

        return authResult(user, httpRequest);
    }

    // Rotiert das Refresh-Token (siehe RefreshTokenService#rotate) und stellt
    // einen frischen Access-Token für denselben User aus.
    public AuthResult refresh(String refreshToken, HttpServletRequest httpRequest) {
        RefreshTokenService.RotationResult rotation = refreshTokenService.rotate(refreshToken, httpRequest);
        String token = jwtService.generateToken(rotation.user());
        return new AuthResult(new AuthResponse(UserResponse.from(rotation.user())), token, rotation.rawToken());
    }

    private AuthResult authResult(User user, HttpServletRequest httpRequest) {
        String token = jwtService.generateToken(user);
        String refreshToken = refreshTokenService.issue(user, httpRequest);
        return new AuthResult(new AuthResponse(UserResponse.from(user)), token, refreshToken);
    }

    public VerificationStatus verifyEmail(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token).orElse(null);
        if (verificationToken == null) {
            return VerificationStatus.INVALID;
        }

        if (verificationToken.getExpiresAt().isBefore(Instant.now())) {
            verificationTokenRepository.delete(verificationToken);
            return VerificationStatus.EXPIRED;
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        verificationTokenRepository.delete(verificationToken);

        return VerificationStatus.VERIFIED;
    }

    // Antwortet in jedem Fall mit derselben generischen Message (Controller-Ebene),
    // damit dieser Endpunkt nicht zum Enumerieren registrierter E-Mail-Adressen
    // missbraucht werden kann. Kein Match, bereits verifiziert oder innerhalb der
    // Cooldown-Frist -> no-op.
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || Boolean.TRUE.equals(user.getEmailVerified())) {
            return;
        }

        boolean withinCooldown = verificationTokenRepository
                .findFirstByUserIdOrderByDateCreatedDesc(user.getId())
                .map(t -> t.getDateCreated().plusSeconds(resendCooldownSeconds).isAfter(Instant.now()))
                .orElse(false);
        if (withinCooldown) {
            return;
        }

        verificationTokenRepository.deleteByUserId(user.getId());
        issueVerificationToken(user);
    }

    private void issueVerificationToken(User user) {
        VerificationToken verificationToken = VerificationToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(Instant.now().plusSeconds(verificationExpiryHours * 3600))
                .build();
        verificationTokenRepository.save(verificationToken);

        String verificationLink = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/api/auth/verify-email")
                .queryParam("token", verificationToken.getToken())
                .build()
                .toUriString();

        // Ein Ausfall des Brevo-API-Aufrufs darf die Registrierung nicht mit
        // einem 500 scheitern lassen - der User-Datensatz ist zu diesem
        // Zeitpunkt bereits gespeichert, ein erneuter Versuch würde nur auf
        // EmailAlreadyExistsException laufen. Der Nutzer kann die E-Mail
        // stattdessen über "erneut senden" anfordern. Der Link wird
        // zusätzlich auf DEBUG geloggt, damit die Verifizierung auch lokal
        // ohne Brevo-API-Key testbar ist.
        logger.debug("Verification link for {}: {}", user.getEmail(), verificationLink);
        emailService.send(user.getEmail(), "Bestätige deine E-Mail-Adresse bei Recur",
                "Hallo " + user.getFirstName() + ",\n\n"
                        + "bitte bestätige deine E-Mail-Adresse, indem du auf den folgenden Link klickst:\n\n"
                        + verificationLink + "\n\n"
                        + "Dieser Link ist 24 Stunden gültig.\n\n"
                        + "Falls du dich nicht bei Recur registriert hast, kannst du diese E-Mail ignorieren.");
    }

    // Antwortet immer gleich (Controller-Ebene), egal ob das Konto existiert,
    // ein Google-Konto ist (kein passwordHash) oder noch nicht verifiziert ist
    // (keine bestätigte Möglichkeit, den echten Inhaber zu erreichen) -
    // verhindert, dass dieser Endpunkt registrierte E-Mail-Adressen oder deren
    // Login-Methode enumerierbar macht.
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.getProvider() != AuthProvider.LOCAL
                || !Boolean.TRUE.equals(user.getEmailVerified())) {
            return;
        }

        boolean withinCooldown = passwordResetTokenRepository
                .findFirstByUserIdOrderByDateCreatedDesc(user.getId())
                .map(t -> t.getDateCreated().plusSeconds(passwordResetCooldownSeconds).isAfter(Instant.now()))
                .orElse(false);
        if (withinCooldown) {
            return;
        }

        passwordResetTokenRepository.deleteByUserId(user.getId());
        issuePasswordResetToken(user);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token).orElse(null);
        if (resetToken == null) {
            throw new InvalidPasswordResetTokenException();
        }

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new InvalidPasswordResetTokenException();
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        passwordResetTokenRepository.delete(resetToken);
    }

    private void issuePasswordResetToken(User user) {
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(Instant.now().plusSeconds(passwordResetExpiryHours * 3600))
                .build();
        passwordResetTokenRepository.save(resetToken);

        String resetLink = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/reset-password")
                .queryParam("token", resetToken.getToken())
                .build()
                .toUriString();

        logger.debug("Password reset link for {}: {}", user.getEmail(), resetLink);
        emailService.send(user.getEmail(), "Setze dein Passwort bei Recur zurück",
                "Hallo " + user.getFirstName() + ",\n\n"
                        + "du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den folgenden Link, "
                        + "um ein neues Passwort zu vergeben:\n\n"
                        + resetLink + "\n\n"
                        + "Dieser Link ist 1 Stunde gültig.\n\n"
                        + "Falls du kein neues Passwort angefordert hast, kannst du diese E-Mail ignorieren "
                        + "- dein Passwort bleibt unverändert.");
    }

    // Tauscht das kurzlebige HttpOnly-Handoff-Cookie (siehe
    // OAuth2AuthenticationSuccessHandler) gegen die gleiche AuthResponse-Form
    // wie beim normalen Login - der Token selbst wird dabei nicht neu
    // ausgestellt, nur validiert; der Controller setzt ihn als Access-Token-
    // Cookie (#160).
    public record TokenExchangeResult(AuthResponse authResponse, String accessToken) {
    }

    public TokenExchangeResult exchangeOAuth2Token(String token) {
        String email;
        try {
            email = jwtService.extractEmail(token);
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidCredentialsException();
        }

        if (email == null || !jwtService.isTokenValid(token, email)) {
            throw new InvalidCredentialsException();
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);

        return new TokenExchangeResult(new AuthResponse(UserResponse.from(user)), token);
    }

    // Räumt beim Löschen eines Accounts (siehe UserService#deleteCurrentUser)
    // die auth-eigenen Referenzen auf den User auf - muss synchron laufen,
    // bevor UserService den User selbst löscht, sonst schlagen die
    // FK-Constraints von verification_token.user_id bzw.
    // password_reset_token.user_id fehl (Standard-@EventListener ist
    // synchron im selben Thread/derselben Transaktion).
    @EventListener
    public void onUserDeleted(UserDeletedEvent event) {
        verificationTokenRepository.deleteByUserId(event.userId());
        passwordResetTokenRepository.deleteByUserId(event.userId());
        refreshTokenService.deleteAllForUser(event.userId());
    }
}
