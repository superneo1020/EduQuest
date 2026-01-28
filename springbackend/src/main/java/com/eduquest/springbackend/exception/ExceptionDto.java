package com.eduquest.springbackend.exception;

public record ExceptionDto(
        String timestamp,
        int status,
        String error,
        String message
) {
}
