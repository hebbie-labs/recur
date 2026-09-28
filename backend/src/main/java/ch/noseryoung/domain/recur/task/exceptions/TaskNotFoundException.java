package ch.noseryoung.domain.recur.task.exceptions;

import java.util.UUID;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class TaskNotFoundException extends ApiException {

    public TaskNotFoundException(UUID id) {
        super(HttpStatus.NOT_FOUND, "Task not found", "Task mit ID " + id + " wurde nicht gefunden");
    }
}
