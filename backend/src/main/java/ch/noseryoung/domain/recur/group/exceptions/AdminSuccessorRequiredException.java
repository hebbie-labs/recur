package ch.noseryoung.domain.recur.group.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class AdminSuccessorRequiredException extends ApiException {

    public AdminSuccessorRequiredException() {
        super(HttpStatus.CONFLICT, "Conflict",
                "Als Admin musst du zuerst einen Nachfolger bestimmen, bevor du die Gruppe verlassen kannst");
    }
}
