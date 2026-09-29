package ch.noseryoung.domain.recur.auth.security.oauth2;

import ch.noseryoung.domain.recur.user.enums.AuthProvider;

// Was der Provider über den Nutzer liefert, bereits validiert (E-Mail
// vorhanden und verifiziert). Enthält bewusst noch keinen Recur-User - welcher
// Account dazu gehört, entscheidet erst OAuth2AccountLinkingService.
public record OAuth2Identity(
        AuthProvider provider,
        String subjectId,
        String email,
        String firstName,
        String lastName,
        String avatarUrl) {
}
