package com.eduquest.springbackend.dto;

import java.time.Instant;

public record CourseResponse(
        Long id,
        String grade,
        String suffix,
        String academicYear,
        Instant createdAt
) {
}
