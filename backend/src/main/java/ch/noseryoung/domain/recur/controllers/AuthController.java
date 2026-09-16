package ch.noseryoung.domain.recur.controllers;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import ch.noseryoung.domain.recur.dto.AuthResponse;
import ch.noseryoung.domain.recur.dto.LoginRequest;
import ch.noseryoung.domain.recur.dto.MessageResponse;
import ch.noseryoung.domain.recur.dto.RegisterRequest;
import ch.noseryoung.domain.recur.dto.ResendVerificationRequest;
import ch.noseryoung.domain.recur.dto.UserResponse;
import ch.noseryoung.domain.recur.enums.VerificationStatus;
import ch.noseryoung.domain.recur.exceptions.InvalidCredentialsException;
import ch.noseryoung.domain.recur.security.OAuth2AuthenticationSuccessHandler;
import ch.noseryoung.domain.recur.services.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class AuthController {

    private static final MessageResponse RESEND_MESSAGE = new MessageResponse(
            "Falls ein Konto mit dieser E-Mail-Adresse existiert und noch nicht bestätigt ist, haben wir dir eine neue Bestätigungs-E-Mail geschickt.");

    private final AuthService authService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
        VerificationStatus status = authService.verifyEmail(token);

        URI redirectUri = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/verify-email")
                .queryParam("status", status.name().toLowerCase())
                .build()
                .toUri();

        return ResponseEntity.status(HttpStatus.FOUND).location(redirectUri).build();
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<MessageResponse> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request.email());
        return ResponseEntity.ok(RESEND_MESSAGE);
    }

    // Tauscht das kurzlebige HttpOnly-Handoff-Cookie (gesetzt von
    // OAuth2AuthenticationSuccessHandler) gegen die AuthResponse im Response-
    // Body ein, statt das JWT in der Redirect-URL zu übertragen. Löscht das
    // Cookie danach sofort, da es nur für diesen einen Austausch gedacht ist.
    @GetMapping("/oauth2/token")
    public ResponseEntity<AuthResponse> exchangeOAuth2Token(
            @CookieValue(name = OAuth2AuthenticationSuccessHandler.HANDOFF_COOKIE_NAME, required = false) String handoffToken,
            HttpServletRequest request) {
        if (handoffToken == null) {
            throw new InvalidCredentialsException();
        }

        AuthResponse authResponse = authService.exchangeOAuth2Token(handoffToken);

        ResponseCookie clearCookie = ResponseCookie
                .from(OAuth2AuthenticationSuccessHandler.HANDOFF_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(request.isSecure())
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(authResponse);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return ResponseEntity.ok(authService.getCurrentUser());
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(@Valid @RequestBody UserResponse userResponse) {
        return ResponseEntity.ok(authService.updateCurrentUser(userResponse));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteCurrentUser() {
        authService.deleteCurrentUser();
        return ResponseEntity.noContent().build();
    }
}