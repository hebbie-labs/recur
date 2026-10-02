package ch.noseryoung.domain.recur.auth.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class DesktopLoginCodeInvalidException extends ApiException {

    public DesktopLoginCodeInvalidException() {
        super(HttpStatus.UNAUTHORIZED, "Desktop login code invalid",
                "Der Desktop-Login ist abgelaufen oder ungültig. Bitte melde dich erneut an.");
    }
}
