package ch.noseryoung.domain.recur.auth.security.oauth2;

import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import ch.noseryoung.domain.recur.auth.enums.OAuth2Mode;
import jakarta.servlet.http.HttpServletRequest;

// Übernimmt ?mode=register von /oauth2/authorization/{provider} in die
// Attribute des Authorization-Requests (#236). Die werden serverseitig
// zusammen mit dem state gespeichert, der Wert kann auf dem Rückweg vom
// Provider also nicht manipuliert werden. Gelesen wird er in
// OAuth2ModeAuthorizationRequestRepository.
public class OAuth2ModeAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    public static final String MODE_ATTRIBUTE = "recur_oauth2_mode";

    // Spring-Default von OAuth2AuthorizationRequestRedirectFilter - die
    // Frontend-Buttons verlinken auf /oauth2/authorization/{provider}.
    private static final String AUTHORIZATION_BASE_URI = "/oauth2/authorization";

    private final DefaultOAuth2AuthorizationRequestResolver delegate;

    public OAuth2ModeAuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository,
                AUTHORIZATION_BASE_URI);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        return withMode(request, delegate.resolve(request));
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        return withMode(request, delegate.resolve(request, clientRegistrationId));
    }

    private OAuth2AuthorizationRequest withMode(HttpServletRequest request,
            OAuth2AuthorizationRequest authorizationRequest) {
        if (authorizationRequest == null) {
            return null;
        }

        OAuth2Mode mode = "register".equalsIgnoreCase(request.getParameter("mode"))
                ? OAuth2Mode.REGISTER
                : OAuth2Mode.LOGIN;

        return OAuth2AuthorizationRequest.from(authorizationRequest)
                .attributes(attributes -> attributes.put(MODE_ATTRIBUTE, mode.name()))
                .build();
    }
}
