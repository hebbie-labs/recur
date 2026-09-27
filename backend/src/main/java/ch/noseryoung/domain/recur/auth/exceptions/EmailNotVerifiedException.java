package ch.noseryoung.domain.recur.auth.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class EmailNotVerifiedException extends ApiException {

    public EmailNotVerifiedException() {
        super(HttpStatus.FORBIDDEN, "Email not verified", "Bitte bestätige zuerst deine E-Mail-Adresse");
    }
}
