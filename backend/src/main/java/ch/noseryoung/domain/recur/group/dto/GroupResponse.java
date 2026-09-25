package ch.noseryoung.domain.recur.group.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import ch.noseryoung.domain.recur.group.model.TaskGroup;
import ch.noseryoung.domain.recur.user.dto.UserSummary;

// Ersetzt die direkte Serialisierung von TaskGroup: createdBy/members als
// UserSummary statt volles User-Objekt (siehe GroupService#toResponse für
// die Maskierung).
public record GroupResponse(
        UUID id,
        String name,
        String inviteCode,
        Instant dateCreated,
        UserSummary createdBy,
        Set<UserSummary> members) {

    public static GroupResponse from(TaskGroup group, UserSummary createdBy, Set<UserSummary> members) {
        return new GroupResponse(group.getId(), group.getName(), group.getInviteCode(), group.getDateCreated(),
                createdBy, members);
    }
}
