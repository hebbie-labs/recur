package ch.noseryoung.domain.recur.auth.security.oauth2;

import java.util.Map;

import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

public class CustomOAuth2User extends DefaultOAuth2User implements RecurOAuth2User {

    private final OAuth2Identity identity;

    public CustomOAuth2User(OAuth2Identity identity, Map<String, Object> attributes) {
        super(
                null,
                attributes,
                "email");

        this.identity = identity;
    }

    @Override
    public OAuth2Identity getIdentity() {
        return identity;
    }
}
