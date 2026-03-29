package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.Size;

public record ItemStoreRequest(
        @Size(max = 20)
        String type,

        @Size(max = 50)
        String name,

        Boolean filterWithUserPoints
) {
}
