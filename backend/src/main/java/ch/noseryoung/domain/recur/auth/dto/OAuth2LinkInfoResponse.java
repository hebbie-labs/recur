package ch.noseryoung.domain.recur.auth.dto;

import ch.noseryoung.domain.recur.user.enums.AuthProvider;

// Was die /auth/link-Seite anzeigen muss: welcher Account, welcher Provider,
// und ob zur Bestätigung ein Passwort nötig ist.
public record OAuth2LinkInfoResponse(String email, AuthProvider provider, boolean passwordRequired) {
}
