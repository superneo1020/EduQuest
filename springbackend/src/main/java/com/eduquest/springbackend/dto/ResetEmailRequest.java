package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Reset email request dto
 * @param newEmail
 */
public record ResetEmailRequest(
        @NotBlank
        @Email
        @Size(max = 255)
        String newEmail
) {
}
