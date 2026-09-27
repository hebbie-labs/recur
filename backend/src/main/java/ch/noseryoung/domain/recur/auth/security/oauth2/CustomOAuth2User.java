package ch.noseryoung.domain.recur.auth.security.oauth2;

import java.util.Map;

import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

import ch.noseryoung.domain.recur.user.model.User;

public class CustomOAuth2User extends DefaultOAuth2User implements RecurOAuth2User {

    private final User user;

    public CustomOAuth2User(User user, Map<String, Object> attributes) {
        super(
                null,
                attributes,
                "email");

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