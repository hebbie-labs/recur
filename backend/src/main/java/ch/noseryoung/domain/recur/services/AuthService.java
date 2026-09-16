package ch.noseryoung.domain.recur.services;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import ch.noseryoung.domain.recur.dto.AuthResponse;
import ch.noseryoung.domain.recur.dto.LoginRequest;
import ch.noseryoung.domain.recur.dto.RegisterRequest;
import ch.noseryoung.domain.recur.dto.UserResponse;
import ch.noseryoung.domain.recur.enums.AuthProvider;
import ch.noseryoung.domain.recur.exceptions.EmailAlreadyExistsException;
import ch.noseryoung.domain.recur.exceptions.InvalidCredentialsException;
import ch.noseryoung.domain.recur.models.User;
import ch.noseryoung.domain.recur.repositories.NotificationSettingsRepository;
import ch.noseryoung.domain.recur.repositories.UserPrivacySettingsRepository;
import ch.noseryoung.domain.recur.repositories.UserRepository;
import ch.noseryoung.domain.recur.security.JwtService;
import io.jsonwebtoken.JwtException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserPrivacySettingsRepository privacySettingsRepository;
    private final NotificationSettingsRepository notificationSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, UserPrivacySettingsRepository privacySettingsRepository,
            NotificationSettingsRepository notificationSettingsRepository,
            PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.privacySettingsRepository = privacySettingsRepository;
        this.notificationSettingsRepository = notificationSettingsRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .provider(AuthProvider.LOCAL)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, UserResponse.from(user));
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);

        // Kein passwordHash -> Konto wurde nur über Google angelegt, es existiert
        // kein lokales Passwort, gegen das geprüft werden könnte.
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, UserResponse.from(user));
    }

    // Tauscht das kurzlebige HttpOnly-Handoff-Cookie (siehe
    // OAuth2AuthenticationSuccessHandler) gegen die gleiche AuthResponse-Form
    // wie beim normalen Login - der Token selbst wird dabei nicht neu
    // ausgestellt, nur validiert und an den Client zurückgegeben.
    public AuthResponse exchangeOAuth2Token(String token) {
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

        return new AuthResponse(token, UserResponse.from(user));
    }

    public UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authentifizierter User nicht gefunden: " + email));

        return UserResponse.from(user);
    }

    public UserResponse updateCurrentUser(UserResponse userResponse) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authentifizierter User nicht gefunden: " + email));


        user.setFirstName(userResponse.firstName());
        user.setLastName(userResponse.lastName());
        user.setAvatarUrl(userResponse.avatarUrl());

        userRepository.save(user);

        return UserResponse.from(user);
    }
    public void deleteCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authentifizierter User nicht gefunden: " + email));

        // Muss vor dem User gelöscht werden, sonst schlägt der Delete an der
        // FK-Constraint von user_privacy_settings.user_id bzw.
        // notification_settings.user_id fehl.
        privacySettingsRepository.findByUserId(user.getId())
                .ifPresent(privacySettingsRepository::delete);
        notificationSettingsRepository.findByUserId(user.getId())
                .ifPresent(notificationSettingsRepository::delete);

        userRepository.delete(user);
    }

}