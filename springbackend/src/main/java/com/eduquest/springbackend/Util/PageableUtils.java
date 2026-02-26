package com.eduquest.springbackend.Util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Set;

public class PageableUtils {

    private PageableUtils() {
        // Prevent instantiation
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    // Define a whitelist of fields that can be sorted
    public static Pageable filterSort(Pageable pageable, Set<String> allowedFields) {
        if (pageable.getSort().isUnsorted()) return pageable;

        // 1. Filter out valid sorting items
        List<Sort.Order> validOrders = pageable.getSort()
                .stream()
                .filter(order -> allowedFields.contains(order.getProperty()))
                .toList();

        // 2. If no valid one is found, return an unsorted Pageable
        if (validOrders.isEmpty()) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.unsorted());
        }

        // 3. Otherwise, sort using only valid fields.
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(validOrders));
    }

}

