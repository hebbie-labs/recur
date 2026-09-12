package ch.noseryoung.domain.recur.exceptions;

import java.util.UUID;

public class GroupNotFoundException extends RuntimeException {

    public GroupNotFoundException(UUID id) {
        super("Gruppe mit ID " + id + " wurde nicht gefunden");
    }

    public GroupNotFoundException(String inviteCode) {
        super("Kein Invite-Link mit Code " + inviteCode + " gefunden");
    }
}
