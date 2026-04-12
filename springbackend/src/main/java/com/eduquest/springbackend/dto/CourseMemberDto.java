package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.RoleInClass;

import java.time.Instant;

public record CourseMemberDto(
        Long userId,
        String username,
        String email,
        Instant createdAt,
        Instant updatedAt,
        RoleInClass roleInClass
) {
}
