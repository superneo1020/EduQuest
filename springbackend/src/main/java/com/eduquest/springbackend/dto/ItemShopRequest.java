package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.Size;

/**
 * Item shop request
 * @param type
 * @param name
 * @param filterWithUserPoints whether to filter items price lower than user points
 */
public record ItemShopRequest(
        @Size(max = 20)
        String type,

        @Size(max = 50)
        String name,

        Boolean filterWithUserPoints
) {
}
