package ch.noseryoung.domain.recur.exceptions;

public class ProjectNotArchivedException extends RuntimeException {

    public ProjectNotArchivedException() {
        super("Projekt muss erst archiviert werden, bevor es gelöscht werden kann");
    }
}
