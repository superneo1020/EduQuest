package com.eduquest.springbackend.dto;

import java.util.List;

/**
 * Page response
 * @param content The list of the page content
 * @param currentPage The current page for the request
 * @param totalPages The total page available for the request
 * @param totalItems The actual total amount of elements
 * @param hasNext Whether there is a next page
 * @param hasPrevious Whether there is a previous page
 * @param <T> The type of record in the page content
 */
public record UtilPageResponse<T>(
        List<T> content,
        int currentPage,
        int totalPages,
        long totalItems,
        boolean hasNext,
        boolean hasPrevious
) {
}
