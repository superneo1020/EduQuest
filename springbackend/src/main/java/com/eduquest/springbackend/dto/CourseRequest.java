package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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
