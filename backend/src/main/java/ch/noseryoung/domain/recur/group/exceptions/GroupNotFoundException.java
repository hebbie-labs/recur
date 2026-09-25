package ch.noseryoung.domain.recur.group.exceptions;

import java.util.UUID;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class GroupNotFoundException extends ApiException {

    public GroupNotFoundException(UUID id) {
        super(HttpStatus.NOT_FOUND, "Group not found", "Gruppe mit ID " + id + " wurde nicht gefunden");
    }

    public GroupNotFoundException(String inviteCode) {
        super(HttpStatus.NOT_FOUND, "Group not found", "Kein Invite-Link mit Code " + inviteCode + " gefunden");
    }
}
