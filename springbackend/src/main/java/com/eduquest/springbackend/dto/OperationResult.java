package com.eduquest.springbackend.dto;

public record OperationResult(
        String message,
        Boolean warning
) {
}
