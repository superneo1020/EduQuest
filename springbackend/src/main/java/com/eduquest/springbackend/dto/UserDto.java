package com.eduquest.springbackend.dto;

import java.time.Instant;
import java.util.List;

/**
 * User dto
 * @param username
 * @param email
 * @param points
 * @param roles
 * @param school
 * @param createdAt
 * @param updatedAt
 */
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
