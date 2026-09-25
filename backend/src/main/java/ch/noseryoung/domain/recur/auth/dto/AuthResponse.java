package ch.noseryoung.domain.recur.auth.dto;

import ch.noseryoung.domain.recur.user.dto.UserResponse;

public record AuthResponse(
        UserResponse user) {
}