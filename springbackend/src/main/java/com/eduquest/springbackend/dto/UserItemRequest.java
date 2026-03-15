package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.NotNull;

public record UserItemRequest(
        @NotNull(message = "Item Name is required")
        String itemName
) {
}
