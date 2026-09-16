package ch.noseryoung.domain.recur.exceptions;

public class NotGroupAdminException extends RuntimeException {

    public NotGroupAdminException() {
        super("Nur der Gruppen-Admin darf diese Aktion ausführen");
    }
}
