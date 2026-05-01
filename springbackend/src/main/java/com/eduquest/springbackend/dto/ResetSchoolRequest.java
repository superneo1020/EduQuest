package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Reset school request dto
 * @param newSchoolName
 */
public record ResetSchoolRequest(
        @NotBlank
        @Size(max = 100)
        String newSchoolName
) {
}
