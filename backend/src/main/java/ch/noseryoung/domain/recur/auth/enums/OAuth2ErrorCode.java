package ch.noseryoung.domain.recur.auth.enums;

// Stabile Codes für /auth/error?code=... - das Frontend mappt sie auf
// handlungsleitende Texte/Buttons, statt Klartext aus der URL anzuzeigen.
public enum OAuth2ErrorCode {
    // Register-Button, aber diese Provider-Identität ist bereits verknüpft.
    ACCOUNT_ALREADY_EXISTS,
    // Nutzer hat die Verknüpfung mit dem bestehenden Account abgelehnt.
    LINK_DECLINED
}
