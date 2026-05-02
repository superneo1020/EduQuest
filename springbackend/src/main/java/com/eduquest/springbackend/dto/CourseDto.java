package com.eduquest.springbackend.dto;

import java.time.Instant;

/**
 * Course DTO
 * @param id
 * @param schoolId
 * @param grade
 * @param suffix
 * @param academicYear
 * @param createdAt
 * @param updatedAt
 */
public record CourseDto(
        Long id,
        Long schoolId,
        String grade,
        String suffix,
        String academicYear,
        Instant createdAt,
        Instant updatedAt
) {
}
