package ch.noseryoung.domain.recur.auth.security.oauth2;

import java.io.IOException;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import ch.noseryoung.domain.recur.auth.enums.OAuth2ErrorCode;
import ch.noseryoung.domain.recur.auth.security.jwt.JwtService;
import ch.noseryoung.domain.recur.auth.security.jwt.RefreshTokenService;
import ch.noseryoung.domain.recur.auth.service.OAuth2AccountLinkingService;
import ch.noseryoung.domain.recur.auth.service.OAuth2AccountLinkingService.Aborted;
import ch.noseryoung.domain.recur.auth.service.OAuth2AccountLinkingService.LinkRequired;
import ch.noseryoung.domain.recur.auth.service.OAuth2AccountLinkingService.LoggedIn;
import ch.noseryoung.domain.recur.user.model.User;
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

        // Trägt die ausstehende Verknüpfung (#236) bis zur Bestätigung auf
        // /auth/link (siehe AuthController#confirmOAuth2Link). Nur auf die
        // Link-Endpunkte beschränkt, damit es nirgends sonst mitgeschickt wird.
        public static final String LINK_COOKIE_NAME = "oauth_link_pending";
        public static final String LINK_COOKIE_PATH = "/api/auth/oauth2/link";
        public static final Duration LINK_COOKIE_TTL = Duration.ofMinutes(10);

        private final JwtService jwtService;
        private final RefreshTokenService refreshTokenService;
        private final OAuth2AccountLinkingService linkingService;

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

                RecurOAuth2User principal = (RecurOAuth2User) oauthToken.getPrincipal();

                var outcome = linkingService.resolve(
                                principal.getIdentity(),
                                OAuth2ModeAuthorizationRequestRepository.modeOf(request));

                switch (outcome) {
                        case LoggedIn(User user) -> completeLogin(user, request, response);
                        case LinkRequired(PendingOAuth2Link pendingLink) -> startLink(pendingLink, request, response);
                        case Aborted(OAuth2ErrorCode code) -> response.sendRedirect(
                                        UriComponentsBuilder.fromUriString(frontendUrl)
                                                        .path("/auth/error")
                                                        .queryParam("code", code.name())
                                                        .build()
                                                        .toUriString());
                }
        }

        private void completeLogin(User user, HttpServletRequest request, HttpServletResponse response)
                        throws IOException {
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

                // Refresh-Token wird bereits hier ausgestellt (nicht erst in
                // exchangeOAuth2Token), da Login per Google/Passwort immer gleich
                // behandelt werden soll (siehe #159).
                String refreshToken = refreshTokenService.issue(user, request);
                response.addHeader(HttpHeaders.SET_COOKIE,
                                refreshTokenService.buildCookie(refreshToken, request).toString());

                String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                                .path(redirectPath)
                                .build()
                                .toUriString();

                response.sendRedirect(redirectUrl);
        }

        // Noch KEIN Login: es gibt bereits einen Account mit dieser E-Mail, und
        // der Nutzer muss die Verknüpfung erst auf /auth/link bestätigen.
        private void startLink(PendingOAuth2Link pendingLink, HttpServletRequest request,
                        HttpServletResponse response) throws IOException {
                String linkToken = jwtService.generateOAuth2LinkToken(pendingLink, LINK_COOKIE_TTL);

                response.addHeader(HttpHeaders.SET_COOKIE,
                                buildLinkCookie(linkToken, LINK_COOKIE_TTL, request).toString());

                response.sendRedirect(UriComponentsBuilder.fromUriString(frontendUrl)
                                .path("/auth/link")
                                .build()
                                .toUriString());
        }

        public static ResponseCookie buildLinkCookie(String value, Duration maxAge, HttpServletRequest request) {
                return ResponseCookie.from(LINK_COOKIE_NAME, value)
                                .httpOnly(true)
                                .secure(request.isSecure())
                                .path(LINK_COOKIE_PATH)
                                .maxAge(maxAge)
                                .sameSite("Lax")
                                .build();
        }
}
