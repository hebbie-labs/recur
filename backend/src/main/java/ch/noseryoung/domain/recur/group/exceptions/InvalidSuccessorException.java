package ch.noseryoung.domain.recur.group.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class InvalidSuccessorException extends ApiException {

    public InvalidSuccessorException() {
        super(HttpStatus.BAD_REQUEST, "Bad request", "Der gewählte Nachfolger ist kein gültiges Mitglied dieser Gruppe");
    }
}
