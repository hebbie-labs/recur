package ch.noseryoung.domain.recur.auth.security.oauth2;

import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import ch.noseryoung.domain.recur.auth.enums.OAuth2Mode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Spring entfernt den gespeicherten Authorization-Request beim Callback, bevor
// der SuccessHandler läuft - und das OAuth2AuthenticationToken, das dort
// ankommt, kennt ihn nicht mehr. Diese Hülle um das Standard-Repository
// kopiert den Modus (siehe OAuth2ModeAuthorizationRequestResolver) deshalb
// beim Entfernen in ein Request-Attribut, das bis zum SuccessHandler lebt.
public class OAuth2ModeAuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    private final HttpSessionOAuth2AuthorizationRequestRepository delegate = new HttpSessionOAuth2AuthorizationRequestRepository();

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return delegate.loadAuthorizationRequest(request);
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request, HttpServletResponse response) {
        delegate.saveAuthorizationRequest(authorizationRequest, request, response);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
            HttpServletResponse response) {
        OAuth2AuthorizationRequest authorizationRequest = delegate.removeAuthorizationRequest(request, response);
        if (authorizationRequest != null) {
            Object mode = authorizationRequest.getAttribute(OAuth2ModeAuthorizationRequestResolver.MODE_ATTRIBUTE);
            request.setAttribute(OAuth2ModeAuthorizationRequestResolver.MODE_ATTRIBUTE, mode);
        }
        return authorizationRequest;
    }

    public static OAuth2Mode modeOf(HttpServletRequest request) {
        Object mode = request.getAttribute(OAuth2ModeAuthorizationRequestResolver.MODE_ATTRIBUTE);
        return OAuth2Mode.REGISTER.name().equals(mode) ? OAuth2Mode.REGISTER : OAuth2Mode.LOGIN;
    }
}
