package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Course request
 * @param grade the first syntax of the course (e.g. Y4)
 * @param suffix the second syntax of the course (e.g. A)
 * @param academicYear the third syntax of the course (e.g. 2024-2025)
 */
public record CourseRequest(
        @NotBlank
        @Size(max = 10)
        String grade,

        @NotBlank
        @Size(max = 10)
        String suffix,

        @NotBlank
        @Size(max = 10)
        String academicYear
) {
}
