package ch.noseryoung.domain.recur.group.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class NotGroupAdminException extends ApiException {

    public NotGroupAdminException() {
        super(HttpStatus.FORBIDDEN, "Forbidden", "Nur der Gruppen-Admin darf diese Aktion ausführen");
    }
}
