package ch.noseryoung.domain.recur.group.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class ProjectNotArchivedException extends ApiException {

    public ProjectNotArchivedException() {
        super(HttpStatus.FORBIDDEN, "Forbidden", "Projekt muss erst archiviert werden, bevor es gelöscht werden kann");
    }
}
