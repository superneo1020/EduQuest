package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.EducatorStatus;
import jakarta.validation.constraints.Size;

/**
 * User request with filters for admin
 * @param username
 * @param email
 * @param schoolName
 * @param educatorStatus
 * @param isActive
 * @param roleId
 */
public record AdminFilterForUserRequest(
        @Size(max = 20)
        String username,

        @Size(max = 255)
        String email,

        @Size(max = 100)
        String schoolName,

        EducatorStatus educatorStatus,
        Boolean isActive,
        Long roleId
){
}
