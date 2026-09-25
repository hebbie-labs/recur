package ch.noseryoung.domain.recur.group.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class NotGroupMemberException extends ApiException {

    public NotGroupMemberException() {
        super(HttpStatus.FORBIDDEN, "Forbidden", "Du bist kein Mitglied dieser Gruppe");
    }
}
