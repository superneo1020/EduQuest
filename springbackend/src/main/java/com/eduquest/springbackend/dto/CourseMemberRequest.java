package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.RoleInClass;
import jakarta.validation.constraints.NotNull;

/**
 * Course member request
 * @param userId The ID of the student or teacher being managed
 * @param courseId The ID of the destination course
 * @param role The functional role to be assigned for the course (e.g., TEACHER, STUDENT).
 */
public record CourseMemberRequest(
        @NotNull
        Long userId,

        @NotNull
        Long courseId,

        @NotNull
        RoleInClass role
) {
}
