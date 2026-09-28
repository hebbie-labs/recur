package ch.noseryoung.domain.recur.user.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class PasswordAlreadySetException extends ApiException {

    public PasswordAlreadySetException() {
        super(HttpStatus.CONFLICT, "Password already set", "Für dieses Konto ist bereits ein Passwort gesetzt");
    }
}
