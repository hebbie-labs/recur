package ch.noseryoung.domain.recur.auth.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class EmailAlreadyExistsException extends ApiException {

    public EmailAlreadyExistsException(String email) {
        super(HttpStatus.CONFLICT, "Email already exists", "Ein Konto mit der E-Mail " + email + " existiert bereits");
    }
}
