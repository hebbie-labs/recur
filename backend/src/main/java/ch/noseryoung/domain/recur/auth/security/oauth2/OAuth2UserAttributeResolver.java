package ch.noseryoung.domain.recur.auth.security.oauth2;

import java.util.Map;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.stereotype.Component;

import ch.noseryoung.domain.recur.user.enums.AuthProvider;

// Liest und validiert nur die Provider-Attribute - welcher Recur-Account dazu
// gehört (oder ob verknüpft werden muss), entscheidet erst
// OAuth2AccountLinkingService im OAuth2AuthenticationSuccessHandler (#236).
// Hier ist das nicht möglich, weil der OAuth2UserService synchron durchläuft
// und dem Nutzer keine Rückfrage ("Verknüpfen? Passwort?") stellen kann.
@Component
public class OAuth2UserAttributeResolver {

    public OAuth2Identity resolve(Map<String, Object> attributes,
            String providerName, Map<String, Object> providerSpecificAttributes) {

        if ("google".equals(providerName)) {

            String subjectId = (String) attributes.get("sub");
            String email = (String) attributes.get("email");
            String fullName = (String) attributes.get("name");
            String firstName = (String) attributes.get("given_name");
            String lastName = (String) attributes.get("family_name");
            String avatarUrl = (String) attributes.get("picture");

            Boolean emailVerified = (Boolean) attributes.get("email_verified");

            if (subjectId == null || subjectId.isBlank()) {
                throw new OAuth2AuthenticationException(
                        "Google Account liefert keine eindeutige ID.");
            }

            if (email == null || email.isBlank()) {
                throw new OAuth2AuthenticationException(
                        "Google Account besitzt keine E-Mail Adresse.");
            }

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

            return new OAuth2Identity(AuthProvider.GOOGLE, subjectId, email, firstName, lastName, avatarUrl);

        } else if ("github".equals(providerName)) {

            // GitHub liefert die numerische User-ID als Integer/Long.
            Object id = attributes.get("id");
            String email = (String) providerSpecificAttributes.get("email");
            String firstName = (String) attributes.get("name");
            String avatarUrl = (String) attributes.get("avatar_url");

            Boolean verifiedEmail = (Boolean) providerSpecificAttributes.get("verifiedEmail");

            if (id == null) {
                throw new OAuth2AuthenticationException(
                        "GitHub Account liefert keine eindeutige ID.");
            }

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

            return new OAuth2Identity(AuthProvider.GITHUB, String.valueOf(id), email, firstName, null, avatarUrl);

        } else
            throw new IllegalArgumentException(
                    "Unsupported OAuth provider: " + providerName);
    }
}
