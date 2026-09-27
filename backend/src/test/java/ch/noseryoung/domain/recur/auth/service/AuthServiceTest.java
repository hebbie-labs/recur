package ch.noseryoung.domain.recur.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import ch.noseryoung.domain.recur.auth.model.PasswordResetToken;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.repository.UserRepository;
import ch.noseryoung.domain.recur.auth.repository.VerificationTokenRepository;
import ch.noseryoung.domain.recur.auth.repository.PasswordResetTokenRepository;
import ch.noseryoung.domain.recur.auth.security.jwt.JwtService;
import ch.noseryoung.domain.recur.auth.security.jwt.RefreshTokenService;
import ch.noseryoung.domain.recur.shared.service.EmailService;
import ch.noseryoung.domain.recur.auth.dto.LoginRequest;
import ch.noseryoung.domain.recur.auth.dto.RegisterRequest;
import ch.noseryoung.domain.recur.user.enums.AuthProvider;
import ch.noseryoung.domain.recur.auth.exceptions.EmailAlreadyExistsException;
import ch.noseryoung.domain.recur.auth.exceptions.InvalidCredentialsException;
import ch.noseryoung.domain.recur.auth.exceptions.InvalidPasswordResetTokenException;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Deckt Registrierung und Login ab - die sicherheitskritischen Einstiegspunkte
 * der Authentifizierung (Passwort-Hashing, Duplikat-Check,
 * OAuth-only-Konten ohne lokales Passwort, Token-Ausstellung, E-Mail-Verifizierung,
 * Passwort-Reset).
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VerificationTokenRepository verificationTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private EmailService emailService;

    @Mock
    private HttpServletRequest httpRequest;

    private AuthService authService;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, verificationTokenRepository, passwordResetTokenRepository,
                passwordEncoder, jwtService, refreshTokenService, emailService);
        ReflectionTestUtils.setField(authService, "frontendUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(authService, "verificationExpiryHours", 24L);
        ReflectionTestUtils.setField(authService, "resendCooldownSeconds", 60L);
        ReflectionTestUtils.setField(authService, "passwordResetExpiryHours", 1L);
        ReflectionTestUtils.setField(authService, "passwordResetCooldownSeconds", 60L);
    }

    @Test
    void register_rejectsAlreadyRegisteredEmail() {
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);
        RegisterRequest request = new RegisterRequest("taken@example.com", "password123", "Ada", "Lovelace");

        assertThatThrownBy(() -> authService.register(request, httpRequest))
                .isInstanceOf(EmailAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_hashesPasswordAndLogsInDirectly() {
        // E-Mail-Verifizierung ist temporär umgangen (#128) - siehe
        // AuthService#register. Registrierung markiert das Konto direkt als
        // verifiziert und gibt wie vor #110 sofort ein JWT zurück, statt eine
        // (derzeit unzustellbare) Bestätigungs-Mail zu verschicken.
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        RegisterRequest request = new RegisterRequest("new@example.com", "password123", "Ada", "Lovelace");
        var userCaptor = org.mockito.ArgumentCaptor.forClass(User.class);
        when(jwtService.generateToken(any())).thenReturn("jwt-token");

        AuthService.AuthResult result = authService.register(request, httpRequest);

        assertThat(result.accessToken()).isEqualTo("jwt-token");

        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getPasswordHash()).isEqualTo("hashed-password");
        assertThat(savedUser.getProvider()).isEqualTo(AuthProvider.LOCAL);
        assertThat(savedUser.getEmailVerified()).isTrue();

        verify(verificationTokenRepository, never()).save(any());
        verify(emailService, never()).send(anyString(), anyString(), anyString());
    }

    @Test
    void login_allowsUnverifiedEmail() {
        // Verifizierungs-Check ist temporär deaktiviert (#128) - erfasst auch
        // Alt-Konten, die vor dieser Änderung registriert wurden und nie
        // verifiziert werden konnten.
        User user = User.builder()
                .email("unverified@example.com")
                .passwordHash("hashed")
                .emailVerified(false)
                .build();
        when(userRepository.findByEmail("unverified@example.com")).thenReturn(java.util.Optional.of(user));
        when(passwordEncoder.matches("correct", "hashed")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");
        LoginRequest request = new LoginRequest("unverified@example.com", "correct");

        AuthService.AuthResult result = authService.login(request, httpRequest);

        assertThat(result.accessToken()).isEqualTo("jwt-token");
    }

    @Test
    void login_rejectsUnknownEmail() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(java.util.Optional.empty());
        LoginRequest request = new LoginRequest("ghost@example.com", "whatever");

        assertThatThrownBy(() -> authService.login(request, httpRequest))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_rejectsOAuthOnlyAccountWithoutLocalPassword() {
        User googleUser = User.builder()
                .email("google@example.com")
                .passwordHash(null)
                .provider(AuthProvider.GOOGLE)
                .build();
        when(userRepository.findByEmail("google@example.com")).thenReturn(java.util.Optional.of(googleUser));
        LoginRequest request = new LoginRequest("google@example.com", "anyPassword");

        assertThatThrownBy(() -> authService.login(request, httpRequest))
                .isInstanceOf(InvalidCredentialsException.class);

        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void login_rejectsWrongPassword() {
        User user = User.builder().email("user@example.com").passwordHash("hashed").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(java.util.Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);
        LoginRequest request = new LoginRequest("user@example.com", "wrong");

        assertThatThrownBy(() -> authService.login(request, httpRequest))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_succeedsWithCorrectPasswordAndReturnsToken() {
        User user = User.builder().email("user@example.com").passwordHash("hashed").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(java.util.Optional.of(user));
        when(passwordEncoder.matches("correct", "hashed")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");
        LoginRequest request = new LoginRequest("user@example.com", "correct");

        AuthService.AuthResult result = authService.login(request, httpRequest);

        assertThat(result.accessToken()).isEqualTo("jwt-token");
        assertThat(result.authResponse().user().email()).isEqualTo("user@example.com");
    }

    @Test
    void forgotPassword_noOpsForGoogleAccount() {
        User googleUser = User.builder()
                .email("google@example.com")
                .provider(AuthProvider.GOOGLE)
                .emailVerified(true)
                .build();
        when(userRepository.findByEmail("google@example.com")).thenReturn(java.util.Optional.of(googleUser));

        authService.forgotPassword("google@example.com");

        verify(passwordResetTokenRepository, never()).save(any());
        verify(emailService, never()).send(anyString(), anyString(), anyString());
    }

    @Test
    void forgotPassword_noOpsForUnverifiedAccount() {
        User unverifiedUser = User.builder()
                .email("unverified@example.com")
                .provider(AuthProvider.LOCAL)
                .emailVerified(false)
                .build();
        when(userRepository.findByEmail("unverified@example.com")).thenReturn(java.util.Optional.of(unverifiedUser));

        authService.forgotPassword("unverified@example.com");

        verify(passwordResetTokenRepository, never()).save(any());
        verify(emailService, never()).send(anyString(), anyString(), anyString());
    }

    @Test
    void forgotPassword_noOpsForUnknownEmail() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(java.util.Optional.empty());

        authService.forgotPassword("ghost@example.com");

        verify(passwordResetTokenRepository, never()).save(any());
        verify(emailService, never()).send(anyString(), anyString(), anyString());
    }

    @Test
    void forgotPassword_issuesTokenAndSendsEmailForEligibleAccount() {
        User user = User.builder()
                .email("user@example.com")
                .provider(AuthProvider.LOCAL)
                .emailVerified(true)
                .build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(java.util.Optional.of(user));
        when(passwordResetTokenRepository.findFirstByUserIdOrderByDateCreatedDesc(user.getId()))
                .thenReturn(java.util.Optional.empty());

        authService.forgotPassword("user@example.com");

        verify(passwordResetTokenRepository).deleteByUserId(user.getId());
        verify(passwordResetTokenRepository).save(any());
        verify(emailService).send(eq(user.getEmail()), anyString(), anyString());
    }

    @Test
    void resetPassword_updatesPasswordHash() {
        User user = User.builder().email("user@example.com").passwordHash("old-hash").build();
        PasswordResetToken token = PasswordResetToken.builder()
                .token("valid-token")
                .user(user)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        when(passwordResetTokenRepository.findByToken("valid-token")).thenReturn(java.util.Optional.of(token));
        when(passwordEncoder.encode("new-password123")).thenReturn("new-hash");

        authService.resetPassword("valid-token", "new-password123");

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        verify(userRepository).save(user);
        verify(passwordResetTokenRepository).delete(token);
    }

    @Test
    void resetPassword_rejectsExpiredToken() {
        User user = User.builder().email("user@example.com").passwordHash("old-hash").build();
        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .token("expired-token")
                .user(user)
                .expiresAt(Instant.now().minusSeconds(60))
                .build();
        when(passwordResetTokenRepository.findByToken("expired-token"))
                .thenReturn(java.util.Optional.of(expiredToken));

        assertThatThrownBy(() -> authService.resetPassword("expired-token", "new-password123"))
                .isInstanceOf(InvalidPasswordResetTokenException.class);

        verify(passwordResetTokenRepository).delete(expiredToken);
        verify(userRepository, never()).save(any());
    }

    @Test
    void resetPassword_rejectsUnknownToken() {
        when(passwordResetTokenRepository.findByToken("unknown-token")).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> authService.resetPassword("unknown-token", "new-password123"))
                .isInstanceOf(InvalidPasswordResetTokenException.class);

        verify(userRepository, never()).save(any());
    }
}
