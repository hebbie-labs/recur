package ch.noseryoung.domain.recur.auth.security.oauth2;

import java.util.UUID;

import ch.noseryoung.domain.recur.user.enums.AuthProvider;

// Inhalt des kurzlebigen oauth_link_pending-Tokens: "diese Provider-Identität
// möchte mit diesem bestehenden Account verknüpft werden" - noch ohne
// Besitznachweis für den Account.
public record PendingOAuth2Link(UUID userId, AuthProvider provider, String subjectId) {
}
