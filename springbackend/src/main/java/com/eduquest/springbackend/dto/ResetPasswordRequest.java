package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Reset password request dto
 * @param oldPassword
 * @param newPassword
 */
public record ResetPasswordRequest(
        @NotBlank
        @Size(min = 8, max = 72)
        String oldPassword,

        @NotBlank
        @Size(min = 8, max = 72)
        String newPassword
) {
}
