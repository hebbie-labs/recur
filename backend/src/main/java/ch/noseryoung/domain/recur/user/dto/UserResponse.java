package ch.noseryoung.domain.recur.user.dto;

import java.util.UUID;

import ch.noseryoung.domain.recur.user.enums.AuthProvider;
import ch.noseryoung.domain.recur.user.model.User;

// provider = nur noch "wie wurde der Account ursprünglich erstellt"
// (informativ, #236) - welche Login-Methoden tatsächlich funktionieren, sagen
// hasPassword und die verknüpften Identitäten (auth/LinkedIdentity).
public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String avatarUrl,
        AuthProvider provider,
        boolean hasPassword) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getAvatarUrl(),
                user.getProvider(),
                user.getPasswordHash() != null);
    }
}
