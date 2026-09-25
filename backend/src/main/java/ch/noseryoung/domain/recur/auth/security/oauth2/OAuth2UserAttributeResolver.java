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

    public User resolve(Map<String, Object> attributes) {
        String email = (String) attributes.get("email");
        String firstName = (String) attributes.get("given_name");
        String lastName = (String) attributes.get("family_name");
        String avatarUrl = (String) attributes.get("picture");
        String fullName = (String) attributes.get("name");

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException(
                    "Google Account besitzt keine Email-Adresse");
        }

        if (firstName == null || firstName.isBlank()) {
            if (fullName != null && !fullName.isBlank()) {
                firstName = fullName.split(" ")[0];
            } else {
                firstName = "Google";
            }
        }

        if (lastName == null || lastName.isBlank()) {
            if (fullName != null && fullName.contains(" ")) {
                String[] parts = fullName.split(" ");
                if (parts.length > 1) {
                    lastName = parts[parts.length - 1];
                }
            }
            if (lastName == null || lastName.isBlank()) {
                lastName = "User";
            }
        }

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> User.builder()
                        .email(email)
                        .provider(AuthProvider.GOOGLE)
                        .enabled(true)
                        .emailVerified(true)
                        .build());

        // Vor dem Speichern gemerkt, da user.getId() danach in jedem Fall gesetzt
        // ist - nur so lässt sich unterscheiden, ob dieser Google-Login gerade
        // erst das Konto angelegt hat (Willkommens-Mail) oder nur ein
        // bestehendes aktualisiert (kein erneuter Mailversand bei jedem Login).
        boolean isNewUser = user.getId() == null;

        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setAvatarUrl(avatarUrl);
        user.setProvider(AuthProvider.GOOGLE);
        user.setEnabled(true);
        // Google verifiziert die Adresse bereits über OIDC - auch wenn dieses
        // Konto ursprünglich lokal registriert und nie bestätigt wurde, gilt es
        // ab jetzt als verifiziert.
        user.setEmailVerified(true);

        User savedUser = userRepository.save(user);

        if (isNewUser) {
            emailService.send(savedUser.getEmail(), "Willkommen bei Recur",
                    "Hallo " + savedUser.getFirstName() + ",\n\n"
                            + "willkommen bei Recur! Dein Konto wurde erfolgreich über Google erstellt.");
        }

        return savedUser;
    }
}