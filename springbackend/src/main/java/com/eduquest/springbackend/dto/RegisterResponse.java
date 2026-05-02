package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.EducatorStatus;

/**
 * Register response dto
 * @param id
 * @param username
 * @param email
 * @param isActive
 * @param educatorStatus
 */
public record RegisterResponse(
        Long id,
        String username,
        String email,
        Boolean isActive,
        EducatorStatus educatorStatus
) {
}
