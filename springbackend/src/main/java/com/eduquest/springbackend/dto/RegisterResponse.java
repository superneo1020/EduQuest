package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.EducatorStatus;

public record RegisterResponse(
        Long id,
        String username,
        String email,
        Boolean isActive,
        EducatorStatus educatorStatus
) {
}
