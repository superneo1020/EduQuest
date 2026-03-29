package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetSchoolRequest(
        @NotBlank
        @Size(max = 100)
        String newSchoolName
) {
}
