package ch.noseryoung.domain.recur.group.exceptions;

import java.util.UUID;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class ProjectNotFoundException extends ApiException {

    public ProjectNotFoundException(UUID id) {
        super(HttpStatus.NOT_FOUND, "Project not found", "Projekt mit ID " + id + " wurde nicht gefunden");
    }
}
