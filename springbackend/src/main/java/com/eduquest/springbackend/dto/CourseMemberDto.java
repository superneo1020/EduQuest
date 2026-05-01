package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.RoleInClass;

import java.time.Instant;

/**
 * Course member DTO
 * @param userId
 * @param username
 * @param email
 * @param createdAt
 * @param updatedAt
 * @param roleInClass
 */
public record CourseMemberDto(
        Long userId,
        String username,
        String email,
        Instant createdAt,
        Instant updatedAt,
        RoleInClass roleInClass
) {
}
