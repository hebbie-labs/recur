package ch.noseryoung.domain.recur.auth.security.oauth2;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;

import ch.noseryoung.domain.recur.user.model.User;

public class CustomOidcUser extends DefaultOidcUser implements RecurOAuth2User {

    private final User user;

    public CustomOidcUser(
            Collection<? extends GrantedAuthority> authorities,
            OidcIdToken idToken,
            OidcUserInfo userInfo,
            User user) {
        super(authorities, idToken, userInfo, "email");

        this.user = user;
    }

    @Override
    public User getUser() {
        return user;
    }

    public String getId() {
        return user.getId().toString();
    }

    public String getEmail() {
        return user.getEmail();
    }

    public String getFirstName() {
        return user.getFirstName();
    }

    public String getLastName() {
        return user.getLastName();
    }

    public String getAvatarUrl() {
        return user.getAvatarUrl();
    }
}