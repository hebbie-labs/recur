package ch.noseryoung.domain.recur.user.dto;

import java.util.UUID;

import ch.noseryoung.domain.recur.user.model.User;

// Ersetzt die direkte Serialisierung von User in Task-/Group-Antworten (siehe
// TaskService/GroupService) - liefert nur, was andere Mitglieder voneinander
// sehen dürfen, nie passwordHash/provider/enabled/emailVerified/dateCreated.
public record UserSummary(UUID id, String firstName, String lastName, String email, String avatarUrl) {

    public static UserSummary from(User user) {
        if (user == null) {
            return null;
        }
        return new UserSummary(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(),
                user.getAvatarUrl());
    }
}
