package com.eduquest.springbackend.dto;

import java.util.List;

/**
 * Slice response
 * @param slice The list of the slice content
 * @param currentPage The current page for the request
 * @param hasNext Whether there is a next page
 * @param hasPrevious Whether there is a previous page
 * @param <T> The type of record in the page content
 */
public record UtilSliceResponse<T>(
        List<T> slice,
        int currentPage,
        boolean hasNext,
        boolean hasPrevious
) {
}
