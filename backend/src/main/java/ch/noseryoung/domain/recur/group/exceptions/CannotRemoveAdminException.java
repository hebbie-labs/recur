package ch.noseryoung.domain.recur.group.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class CannotRemoveAdminException extends ApiException {

    public CannotRemoveAdminException() {
        super(HttpStatus.CONFLICT, "Conflict", "Der Admin kann nicht entfernt werden - zuerst die Adminrolle übertragen");
    }
}
