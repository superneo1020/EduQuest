package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * User item request
 * @param itemName
 */
public record UserItemRequest(
        @NotBlank
        @Size(max = 50)
        String itemName
) {
}
