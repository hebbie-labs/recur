package ch.noseryoung.domain.recur.shared.exceptions;

public record ErrorResponse(
        String timestamp,
        int status,
        String error,
        String message,
        String path) {
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(java.time.OffsetDateTime.now().toString(), status, error, message, path);
    }
}