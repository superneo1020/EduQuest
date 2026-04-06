package com.eduquest.springbackend.dto;

import java.time.Instant;
import java.util.List;

public record UserDto(
        String username,
        String email,
        Integer points,
        List<String> roles,
        String school,
        Instant createdAt,
        Instant updatedAt
) {
}
