package ch.noseryoung.domain.recur.auth.enums;

// Über welchen Button der OAuth-Flow gestartet wurde (#236) - "Registrieren
// mit X" darf nicht stillschweigend in einen bereits verknüpften Account
// einloggen, "Anmelden mit X" schon.
public enum OAuth2Mode {
    LOGIN,
    REGISTER
}
