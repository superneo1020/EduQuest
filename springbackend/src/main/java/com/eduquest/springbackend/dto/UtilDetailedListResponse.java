package com.eduquest.springbackend.dto;

import java.util.List;

/**
 * Detailed list response
 * @param items The original list content
 * @param total The total number of items in the list
 * @param isEmpty Whether the list is empty
 * @param <T> The type of record in the list content
 */
public record UtilDetailedListResponse<T> (
        List<T> items,
        long total,
        boolean isEmpty
) {
}
