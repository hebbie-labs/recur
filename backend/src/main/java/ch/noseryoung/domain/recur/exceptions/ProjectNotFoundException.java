package ch.noseryoung.domain.recur.exceptions;

import java.util.UUID;

public class ProjectNotFoundException extends RuntimeException {

    public ProjectNotFoundException(UUID id) {
        super("Projekt mit ID " + id + " wurde nicht gefunden");
    }
}
