package com.eduquest.springbackend.dto;

public record CourseMemberDto(
        Long id,
        String roleInClass,
        Long userId,
        String username,
        String email
) {
}
