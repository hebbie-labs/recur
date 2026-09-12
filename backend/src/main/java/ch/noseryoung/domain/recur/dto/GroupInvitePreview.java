package ch.noseryoung.domain.recur.dto;

import java.util.UUID;

import ch.noseryoung.domain.recur.models.TaskGroup;
import ch.noseryoung.domain.recur.models.User;

// Vorschau für die Beitritts-Bestätigung: zeigt Gruppenname und Mitgliederzahl,
// bevor der User tatsächlich beitritt (kein Auto-Join beim Öffnen des Links).
public record GroupInvitePreview(
        UUID groupId,
        String groupName,
        int memberCount,
        boolean alreadyMember) {

    public static GroupInvitePreview of(TaskGroup group, User currentUser) {
        return new GroupInvitePreview(
                group.getId(),
                group.getName(),
                group.getMembers().size(),
                group.getMembers().contains(currentUser));
    }
}
