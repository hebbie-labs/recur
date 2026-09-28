package ch.noseryoung.domain.recur.auth.security.oauth2;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final OAuth2UserAttributeResolver attributeResolver;
    private final GithubEmailService githubEmailService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {

        OAuth2User oauthUser = super.loadUser(userRequest);

        String provider = userRequest
                .getClientRegistration()
                .getRegistrationId();

        String email = null;
        boolean verifiedEmail = false;
        if ("github".equals(provider)) {
            email = githubEmailService.getPrimaryEmail(
                    userRequest.getAccessToken().getTokenValue());
            verifiedEmail = githubEmailService.isPrimaryEmailVerified(
                    userRequest.getAccessToken().getTokenValue());
        }

        // HashMap statt Map.of, da email null sein kann (Map.of wirft dann eine
        // NPE statt der sprechenden Fehlermeldung aus dem Resolver).
        Map<String, Object> githubAttributes = new HashMap<>();
        githubAttributes.put("email", email);
        githubAttributes.put("verifiedEmail", verifiedEmail);

        // Validiert vor dem Bau des Principals - DefaultOAuth2User verlangt ein
        // nicht-leeres "email"-Attribut als Namen.
        OAuth2Identity identity = attributeResolver.resolve(oauthUser.getAttributes(), provider, githubAttributes);

        Map<String, Object> attributes = new HashMap<>(oauthUser.getAttributes());
        attributes.put("email", email);
        attributes.put("verifiedEmail", verifiedEmail);

        return new CustomOAuth2User(identity, attributes);
    }
}
