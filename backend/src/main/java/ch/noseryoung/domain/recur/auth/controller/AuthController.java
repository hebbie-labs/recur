package ch.noseryoung.domain.recur.auth.controller;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import ch.noseryoung.domain.recur.auth.dto.AuthResponse;
import ch.noseryoung.domain.recur.auth.dto.ForgotPasswordRequest;
import ch.noseryoung.domain.recur.auth.dto.LoginRequest;
import ch.noseryoung.domain.recur.auth.dto.MessageResponse;
import ch.noseryoung.domain.recur.auth.dto.RegisterRequest;
import ch.noseryoung.domain.recur.auth.dto.ResendVerificationRequest;
import ch.noseryoung.domain.recur.auth.dto.ResetPasswordRequest;
import ch.noseryoung.domain.recur.auth.enums.VerificationStatus;
import ch.noseryoung.domain.recur.auth.exceptions.InvalidCredentialsException;
import ch.noseryoung.domain.recur.auth.exceptions.InvalidRefreshTokenException;
import ch.noseryoung.domain.recur.auth.security.jwt.JwtService;
import ch.noseryoung.domain.recur.auth.security.oauth2.OAuth2AuthenticationSuccessHandler;
import ch.noseryoung.domain.recur.auth.security.jwt.RefreshTokenService;
import ch.noseryoung.domain.recur.auth.service.AuthService;
import ch.noseryoung.domain.recur.auth.service.AuthService.AuthResult;
import ch.noseryoung.domain.recur.auth.service.AuthService.TokenExchangeResult;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class AuthController {

    private static final MessageResponse RESEND_MESSAGE = new MessageResponse(
            "Falls ein Konto mit dieser E-Mail-Adresse existiert und noch nicht bestätigt ist, haben wir dir eine neue Bestätigungs-E-Mail geschickt.");

    private static final MessageResponse FORGOT_PASSWORD_MESSAGE = new MessageResponse(
            "Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir einen Link zum Zurücksetzen deines Passworts geschickt.");

    private static final MessageResponse RESET_PASSWORD_MESSAGE = new MessageResponse(
            "Dein Passwort wurde erfolgreich zurückgesetzt.");

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public AuthController(AuthService authService, RefreshTokenService refreshTokenService, JwtService jwtService) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        AuthResult result = authService.register(request, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, jwtService.buildCookie(result.accessToken(), httpRequest).toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenService.buildCookie(result.refreshToken(), httpRequest).toString())
                .body(result.authResponse());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        AuthResult result = authService.login(request, httpRequest);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtService.buildCookie(result.accessToken(), httpRequest).toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenService.buildCookie(result.refreshToken(), httpRequest).toString())
                .body(result.authResponse());
    }

    // Tauscht das Refresh-Token-Cookie gegen einen frischen Access-Token ein
    // (siehe RefreshTokenService#rotate) und rotiert das Cookie mit. Wird vom
    // Frontend-Response-Interceptor bei einem 401 wegen abgelaufenem
    // Access-Token aufgerufen (siehe api.ts).
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = RefreshTokenService.COOKIE_NAME, required = false) String refreshToken,
            HttpServletRequest httpRequest) {
        if (refreshToken == null) {
            throw new InvalidRefreshTokenException();
        }

        AuthResult result = authService.refresh(refreshToken, httpRequest);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtService.buildCookie(result.accessToken(), httpRequest).toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenService.buildCookie(result.refreshToken(), httpRequest).toString())
                .body(result.authResponse());
    }

    // Revoked nur die eine Session, deren Refresh-Token-Cookie mitgeschickt
    // wird - nicht die anderen Geräte/Sessions des Users (#159).
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = RefreshTokenService.COOKIE_NAME, required = false) String refreshToken,
            HttpServletRequest httpRequest) {
        if (refreshToken != null) {
            refreshTokenService.revoke(refreshToken);
        }

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, jwtService.buildExpiredCookie(httpRequest).toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenService.buildExpiredCookie(httpRequest).toString())
                .build();
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

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ResponseEntity.ok(FORGOT_PASSWORD_MESSAGE);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(RESET_PASSWORD_MESSAGE);
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

        TokenExchangeResult result = authService.exchangeOAuth2Token(handoffToken);

        ResponseCookie clearHandoffCookie = ResponseCookie
                .from(OAuth2AuthenticationSuccessHandler.HANDOFF_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(request.isSecure())
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtService.buildCookie(result.accessToken(), request).toString())
                .header(HttpHeaders.SET_COOKIE, clearHandoffCookie.toString())
                .body(result.authResponse());
    }
}