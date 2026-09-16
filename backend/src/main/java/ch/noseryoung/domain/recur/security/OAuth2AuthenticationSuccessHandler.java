package ch.noseryoung.domain.recur.security;

import java.io.IOException;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import ch.noseryoung.domain.recur.models.User;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler
        implements AuthenticationSuccessHandler {

    // Name des kurzlebigen HttpOnly-Cookies, über das das JWT einmalig an
    // AuthController#exchangeOAuth2Token übergeben wird (siehe dort).
    public static final String HANDOFF_COOKIE_NAME = "oauth_handoff";
    private static final Duration HANDOFF_COOKIE_TTL = Duration.ofSeconds(60);

    private final JwtService jwtService;

    @Value("${app.oauth2.redirect-path}")
    private String redirectPath;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;

        OAuth2User principal = oauthToken.getPrincipal();

        RecurOAuth2User customUser = (RecurOAuth2User) principal;

        User user = customUser.getUser();

        String token = jwtService.generateToken(user);

        // JWT landet bewusst NICHT in der Redirect-URL (Browser-Historie, Referer-
        // Header, Access-Logs), sondern kurz in einem HttpOnly-Cookie, das das
        // Frontend sofort über exchangeOAuth2Token gegen den echten Token im
        // Response-Body eintauscht (siehe AuthController#exchangeOAuth2Token).
        ResponseCookie handoffCookie = ResponseCookie.from(HANDOFF_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(request.isSecure())
                .path("/")
                .maxAge(HANDOFF_COOKIE_TTL)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, handoffCookie.toString());

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                .path(redirectPath)
                .build()
                .toUriString();

        response.sendRedirect(redirectUrl);
    }
}