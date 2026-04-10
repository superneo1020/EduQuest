package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.EducatorStatus;

import java.time.Instant;

public record AdminFilterForUserResponse(
        Long userId,
        String username,
        String email,
        Long schoolId,
        String schoolName,
        boolean isAdmin,
        boolean isEducator,
        Boolean isActive,
        EducatorStatus educatorStatus,
        Instant createdAt,
        Instant updatedAt
) {
}
