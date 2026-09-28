package ch.noseryoung.domain.recur.auth.security.oauth2;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ch.noseryoung.domain.recur.user.model.User;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final OAuth2UserAttributeResolver attributeResolver;
    private final GithubEmailService githubEmailService;

    @Override
    @Transactional
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

        Map<String, Object> githubAttributes = Map.of(
                "email", email,
                "verifiedEmail", verifiedEmail);

        Map<String, Object> attributes = new HashMap<>(oauthUser.getAttributes());
        attributes.put("email", email);
        attributes.put("verifiedEmail", verifiedEmail);

        User user = attributeResolver.resolve(attributes, provider, githubAttributes);

        return new CustomOAuth2User(user, attributes);
    }
}