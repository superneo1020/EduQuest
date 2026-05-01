package com.eduquest.springbackend.dto;

/**
 * Operation result
 * @param message The message output after the operation
 * @param warning Whether the operation contains a warning
 */
public record OperationResult(
        String message,
        Boolean warning
) {
}
