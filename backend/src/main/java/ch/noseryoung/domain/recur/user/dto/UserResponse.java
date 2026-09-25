package ch.noseryoung.domain.recur.user.dto;

import java.util.UUID;

import ch.noseryoung.domain.recur.user.enums.AuthProvider;
import ch.noseryoung.domain.recur.user.model.User;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String avatarUrl,
        AuthProvider provider) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getAvatarUrl(),
                user.getProvider());
    }
}