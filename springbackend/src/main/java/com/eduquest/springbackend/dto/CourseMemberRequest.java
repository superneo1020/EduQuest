package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.RoleInClass;
import jakarta.validation.constraints.NotNull;

public record CourseMemberRequest(
        @NotNull
        Long userId,

        @NotNull
        Long courseId,

        @NotNull
        RoleInClass role
) {
}
