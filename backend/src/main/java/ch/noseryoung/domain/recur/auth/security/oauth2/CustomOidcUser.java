package ch.noseryoung.domain.recur.auth.security.oauth2;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;

public class CustomOidcUser extends DefaultOidcUser implements RecurOAuth2User {

    private final OAuth2Identity identity;

    public CustomOidcUser(
            Collection<? extends GrantedAuthority> authorities,
            OidcIdToken idToken,
            OidcUserInfo userInfo,
            OAuth2Identity identity) {
        super(authorities, idToken, userInfo, "email");

        this.identity = identity;
    }

    @Override
    public OAuth2Identity getIdentity() {
        return identity;
    }
}
