package ch.noseryoung.domain.recur.auth.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class InvalidPasswordResetTokenException extends ApiException {

    public InvalidPasswordResetTokenException() {
        super(HttpStatus.BAD_REQUEST, "Invalid password reset token", "Dieser Link ist ungültig oder abgelaufen");
    }
}
