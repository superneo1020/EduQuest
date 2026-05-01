package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.EducatorStatus;

import java.time.Instant;

/**
 * Response from admin's user filter request
 * @param userId
 * @param username
 * @param email
 * @param schoolId
 * @param schoolName
 * @param isAdmin
 * @param isEducator
 * @param isActive
 * @param educatorStatus
 * @param createdAt
 * @param updatedAt
 */
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
