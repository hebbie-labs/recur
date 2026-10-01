package ch.noseryoung.domain.recur.auth.dto;

// password bleibt null, wenn der bestehende Account selbst passwortlos ist.
public record OAuth2LinkConfirmRequest(String password) {
}
