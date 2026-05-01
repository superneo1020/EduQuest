package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Login request
 * @param username
 * @param password
 */
public record LoginRequest(
        @NotBlank
        @Size(max = 20)
        String username,

        @NotBlank
        @Size(max = 72)
        String password
) {
}
