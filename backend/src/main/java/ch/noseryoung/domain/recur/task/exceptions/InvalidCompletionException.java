package ch.noseryoung.domain.recur.task.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class InvalidCompletionException extends ApiException {

    public InvalidCompletionException(String message) {
        super(HttpStatus.BAD_REQUEST, "Invalid completion", message);
    }
}
