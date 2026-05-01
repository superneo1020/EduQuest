package com.eduquest.springbackend.dto;

import java.time.Instant;

/**
 * Course response
 * @param id
 * @param grade
 * @param suffix
 * @param academicYear
 * @param createdAt
 */
public record CourseResponse(
        Long id,
        String grade,
        String suffix,
        String academicYear,
        Instant createdAt
) {
}
