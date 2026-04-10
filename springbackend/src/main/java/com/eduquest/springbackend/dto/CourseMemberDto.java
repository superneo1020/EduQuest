package com.eduquest.springbackend.dto;

import java.time.Instant;

public record CourseMemberDto(
        Long userId,
        String username,
        String email,
        Instant createdAt,
        Instant updatedAt,
        String roleInClass
) {
}
