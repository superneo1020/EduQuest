package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.Size;

public record ProfileEquippedItemsDto(
        @Size(max = 50)
        String AVATAR,

        @Size(max = 50)
        String BADGE,

        @Size(max = 50)
        String BACKGROUND
) {
}
