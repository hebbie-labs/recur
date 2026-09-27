package ch.noseryoung.domain.recur.auth.security.oauth2;

import java.util.Map;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.stereotype.Component;

import ch.noseryoung.domain.recur.user.enums.AuthProvider;
import ch.noseryoung.domain.recur.user.model.User;
import ch.noseryoung.domain.recur.user.repository.UserRepository;
import ch.noseryoung.domain.recur.shared.service.EmailService;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OAuth2UserAttributeResolver {

    private final UserRepository userRepository;
    private final EmailService emailService;

    // Google needs ASAP aa "sub" attribute

    public User resolve(Map<String, Object> attributes,
            String providerName, Map<String, Object> providerSpecificAttributes) {

        String email;
        String fullName;
        String firstName;
        String lastName;
        String avatarUrl;

        if ("google".equals(providerName)) {

            email = (String) attributes.get("email");
            fullName = (String) attributes.get("name");
            firstName = (String) attributes.get("given_name");
            lastName = (String) attributes.get("family_name");
            avatarUrl = (String) attributes.get("picture");

            Boolean emailVerified = (Boolean) attributes.get("email_verified");

            if (email == null || email.isBlank()) {
                throw new OAuth2AuthenticationException(
                        "Google Account besitzt keine E-Mail Adresse.");
            }

            /*
             * Google verifiziert die Adresse bereits über OIDC - auch wenn dieses
             * Konto ursprünglich lokal registriert und nie bestätigt wurde, gilt es
             * ab jetzt als verifiziert.
             */
            if (!Boolean.TRUE.equals(emailVerified)) {
                throw new OAuth2AuthenticationException(
                        "Google E-Mail Adresse ist nicht verifiziert.");
            }

            if (firstName == null || firstName.isBlank()) {
                if (fullName != null && !fullName.isBlank()) {
                    firstName = fullName.trim().split("\\s+")[0];
                } else {
                    firstName = "Google";
                }
            }

            User user = userRepository.findByEmail(email).orElseGet(() -> User.builder().email(email)
                    .provider(AuthProvider.GOOGLE).enabled(true).emailVerified(true)
                    .build());

            boolean isNewUser = user.getId() == null;

            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setAvatarUrl(avatarUrl);

            User savedUser = userRepository.save(user);

            if (isNewUser) {
                emailService.send(savedUser.getEmail(), "Willkommen bei Recur",
                        "Hallo " + savedUser.getFirstName() + ",\n\n"
                                + "willkommen bei Recur! Dein Konto wurde erfolgreich über Google erstellt.");
            }

            return savedUser;

        } else if ("github".equals(providerName)) {

            email = (String) providerSpecificAttributes.get("email");

            firstName = (String) attributes.get("name");
            lastName = null;
            avatarUrl = (String) attributes.get("avatar_url");

            Boolean verifiedEmail = (Boolean) providerSpecificAttributes.get("verifiedEmail");

            if (email == null || email.isBlank()) {
                throw new OAuth2AuthenticationException(
                        "GitHub Account besitzt keine E-Mail Adresse.");
            }

            if (!Boolean.TRUE.equals(verifiedEmail)) {
                throw new OAuth2AuthenticationException(
                        "GitHub E-Mail Adresse ist nicht verifiziert.");
            }

            if (firstName == null || firstName.isBlank()) {
                firstName = "GitHub User";
            }

            User user = userRepository.findByEmail(email).orElseGet(() -> User.builder().email(email)
                    .provider(AuthProvider.GITHUB).enabled(true).emailVerified(true)
                    .build());

            boolean isNewUser = user.getId() == null;

            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setAvatarUrl(avatarUrl);

            User savedUser = userRepository.save(user);

            if (isNewUser) {
                emailService.send(savedUser.getEmail(), "Willkommen bei Recur",
                        "Hallo " + savedUser.getFirstName() + ",\n\n"
                                + "willkommen bei Recur! Dein Konto wurde erfolgreich über GitHub erstellt.");
            }

            return savedUser;

        } else
            throw new IllegalArgumentException(
                    "Unsupported OAuth provider: " + providerName);
    }
}