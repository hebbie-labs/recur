package ch.noseryoung.domain.recur.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import ch.noseryoung.domain.recur.dto.AuthResponse;
import ch.noseryoung.domain.recur.dto.LoginRequest;
import ch.noseryoung.domain.recur.dto.MessageResponse;
import ch.noseryoung.domain.recur.dto.RegisterRequest;
import ch.noseryoung.domain.recur.enums.AuthProvider;
import ch.noseryoung.domain.recur.exceptions.EmailAlreadyExistsException;
import ch.noseryoung.domain.recur.exceptions.EmailNotVerifiedException;
import ch.noseryoung.domain.recur.exceptions.InvalidCredentialsException;
import ch.noseryoung.domain.recur.models.User;
import ch.noseryoung.domain.recur.repositories.NotificationSettingsRepository;
import ch.noseryoung.domain.recur.repositories.UserPrivacySettingsRepository;
import ch.noseryoung.domain.recur.repositories.UserRepository;
import ch.noseryoung.domain.recur.repositories.VerificationTokenRepository;
import ch.noseryoung.domain.recur.security.JwtService;

/**
 * Deckt Registrierung und Login ab - die sicherheitskritischen Einstiegspunkte
 * der Authentifizierung (Passwort-Hashing, Duplikat-Check,
 * OAuth-only-Konten ohne lokales Passwort, Token-Ausstellung, E-Mail-Verifizierung).
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserPrivacySettingsRepository privacySettingsRepository;

    @Mock
    private NotificationSettingsRepository notificationSettingsRepository;

    @Mock
    private VerificationTokenRepository verificationTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmailService emailService;

    private AuthService authService;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, privacySettingsRepository, notificationSettingsRepository,
                verificationTokenRepository, passwordEncoder, jwtService, emailService);
        ReflectionTestUtils.setField(authService, "frontendUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(authService, "verificationExpiryHours", 24L);
        ReflectionTestUtils.setField(authService, "resendCooldownSeconds", 60L);
    }

    @Test
    void register_rejectsAlreadyRegisteredEmail() {
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);
        RegisterRequest request = new RegisterRequest("taken@example.com", "password123", "Ada", "Lovelace");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(EmailAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_hashesPasswordAndSendsVerificationEmail() {
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        RegisterRequest request = new RegisterRequest("new@example.com", "password123", "Ada", "Lovelace");

        MessageResponse response = authService.register(request);

        assertThat(response.message()).isNotBlank();

        var userCaptor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getPasswordHash()).isEqualTo("hashed-password");
        assertThat(savedUser.getProvider()).isEqualTo(AuthProvider.LOCAL);
        assertThat(savedUser.getEmailVerified()).isFalse();

        verify(verificationTokenRepository).save(any());
        verify(emailService).sendVerificationEmail(eq(savedUser), anyString());
    }

    @Test
    void login_rejectsUnverifiedEmail() {
        User user = User.builder()
                .email("unverified@example.com")
                .passwordHash("hashed")
                .emailVerified(false)
                .build();
        when(userRepository.findByEmail("unverified@example.com")).thenReturn(java.util.Optional.of(user));
        when(passwordEncoder.matches("correct", "hashed")).thenReturn(true);
        LoginRequest request = new LoginRequest("unverified@example.com", "correct");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(EmailNotVerifiedException.class);

        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void login_rejectsUnknownEmail() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(java.util.Optional.empty());
        LoginRequest request = new LoginRequest("ghost@example.com", "whatever");

        assertThatThrownBy(() -> authService.login(request))
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

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);

        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void login_rejectsWrongPassword() {
        User user = User.builder().email("user@example.com").passwordHash("hashed").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(java.util.Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);
        LoginRequest request = new LoginRequest("user@example.com", "wrong");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_succeedsWithCorrectPasswordAndReturnsToken() {
        User user = User.builder().email("user@example.com").passwordHash("hashed").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(java.util.Optional.of(user));
        when(passwordEncoder.matches("correct", "hashed")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");
        LoginRequest request = new LoginRequest("user@example.com", "correct");

        AuthResponse response = authService.login(request);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo("user@example.com");
    }
}
