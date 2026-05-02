package com.eduquest.springbackend.dto;

import com.eduquest.springbackend.enums.RoleInClass;

/**
 * Course member response
 * @param id
 * @param userId
 * @param courseId
 * @param role
 */
public record CourseMemberResponse(
        Long id,
        Long userId,
        Long courseId,
        RoleInClass role
) {
}
