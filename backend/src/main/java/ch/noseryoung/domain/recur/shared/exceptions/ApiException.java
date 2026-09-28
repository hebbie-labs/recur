package ch.noseryoung.domain.recur.shared.exceptions;

import org.springframework.http.HttpStatus;

// Basisklasse für alle domain-eigenen Exceptions: GlobalExceptionHandler
// braucht dadurch nur einen einzigen generischen @ExceptionHandler statt
// eines für jede Domain-Exception, ohne dass shared/ selbst von einer
// Domain importieren müsste.
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String error;

    protected ApiException(HttpStatus status, String error, String message) {
        super(message);
        this.status = status;
        this.error = error;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }
}
