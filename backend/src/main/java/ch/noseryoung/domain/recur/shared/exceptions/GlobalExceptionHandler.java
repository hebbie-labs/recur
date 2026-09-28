package ch.noseryoung.domain.recur.shared.exceptions;

import java.util.HashMap;
import java.util.Map;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

        private static final Logger logger = LogManager.getLogger(GlobalExceptionHandler.class);

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidation(
                        MethodArgumentNotValidException ex,
                        WebRequest request) {

                Map<String, String> errors = new HashMap<>();

                ex.getBindingResult()
                                .getFieldErrors()
                                .forEach(error -> errors.put(
                                                error.getField(),
                                                error.getDefaultMessage()));

                logger.warn("Validation failed: {}", errors);

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(ErrorResponse.of(
                                                400,
                                                "Validation failed",
                                                errors.toString(),
                                                getPath(request)));
        }

        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ErrorResponse> handleTypeMismatch(
                        MethodArgumentTypeMismatchException ex,
                        WebRequest request) {

                logger.warn(
                                "Invalid parameter '{}' with value '{}'",
                                ex.getName(),
                                ex.getValue());

                return ResponseEntity
                                .badRequest()
                                .body(ErrorResponse.of(
                                                400,
                                                "Invalid parameter",
                                                "Parameter '" + ex.getName() + "' has an invalid value",
                                                getPath(request)));
        }

        // Ersetzt die frühere Handler-Methode pro Domain-Exception: jede
        // Domain-Exception bringt über ApiException ihren eigenen Status/Titel
        // mit, sonst müsste shared/ hier jede Exception jeder Domain importieren.
        @ExceptionHandler(ApiException.class)
        public ResponseEntity<ErrorResponse> handleApiException(
                        ApiException ex,
                        WebRequest request) {

                logger.info("{}: {}", ex.getError(), ex.getMessage());

                return ResponseEntity
                                .status(ex.getStatus())
                                .body(ErrorResponse.of(
                                                ex.getStatus().value(),
                                                ex.getError(),
                                                ex.getMessage(),
                                                getPath(request)));
        }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ErrorResponse> handleDatabaseError(
                        DataIntegrityViolationException ex,
                        WebRequest request) {

                logger.error("Database constraint violation", ex);

                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(ErrorResponse.of(
                                                409,
                                                "Database constraint violation",
                                                "The provided data violates a database constraint",
                                                getPath(request)));
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ErrorResponse> handleInvalidJson(
                        HttpMessageNotReadableException ex,
                        WebRequest request) {

                logger.warn("Invalid JSON received: {}", ex.getMessage());

                return ResponseEntity
                                .badRequest()
                                .body(ErrorResponse.of(
                                                400,
                                                "Invalid JSON",
                                                "Request body contains invalid JSON",
                                                getPath(request)));
        }

        @ExceptionHandler(MissingServletRequestParameterException.class)
        public ResponseEntity<ErrorResponse> handleMissingParameter(
                        MissingServletRequestParameterException ex,
                        WebRequest request) {

                logger.warn("Missing request parameter: {}", ex.getParameterName());

                return ResponseEntity
                                .badRequest()
                                .body(ErrorResponse.of(
                                                400,
                                                "Missing parameter",
                                                ex.getParameterName() + " is required",
                                                getPath(request)));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGeneral(
                        Exception ex,
                        WebRequest request) {

                logger.error("Unexpected server error", ex);

                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(ErrorResponse.of(
                                                500,
                                                "Internal server error",
                                                "An unexpected error occurred",
                                                getPath(request)));
        }

        private String getPath(WebRequest request) {
                return request.getDescription(false)
                                .replace("uri=", "");
        }
}
