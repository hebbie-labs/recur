package ch.noseryoung.domain.recur.auth.security.oauth2;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2AuthenticationFailureHandler implements AuthenticationFailureHandler {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception) throws IOException {

        // /auth/error statt /oauth2/error, da /oauth2/** im Vite-Proxy ans Backend
        // weitergeleitet wird - eine SPA-Route mit diesem Präfix würde nie erreicht.
        // Absolute Frontend-URL statt relativem Pfad, da sendRedirect() sonst
        // relativ zum Backend (aktueller Request-Host) aufgelöst würde.
        String message = java.net.URLEncoder.encode(exception.getMessage(), java.nio.charset.StandardCharsets.UTF_8);
        response.sendRedirect(frontendUrl + "/auth/error?message=" + message);
    }
}