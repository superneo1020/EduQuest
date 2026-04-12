package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.RoleInClass;

public record CourseMemberResponse(
        Long id,
        Long userId,
        Long courseId,
        RoleInClass role
) {
}
