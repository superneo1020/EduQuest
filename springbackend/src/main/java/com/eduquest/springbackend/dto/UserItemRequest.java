package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserItemRequest(
        @NotBlank
        @Size(max = 50)
        String itemName
) {
}
