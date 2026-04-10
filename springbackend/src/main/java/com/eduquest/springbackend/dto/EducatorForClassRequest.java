package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.Size;

public record EducatorForClassRequest(
        @Size(max = 10)
        String grade,

        @Size(max = 10)
        String suffix,

        @Size(max = 10)
        String academicYear
) {
}
