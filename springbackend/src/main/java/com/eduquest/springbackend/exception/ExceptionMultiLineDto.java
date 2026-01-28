package com.eduquest.springbackend.exception;

import java.util.Map;

public record ExceptionMultiLineDto(
        String timestamp,
        int status,
        String error,
        Map<String, String> errors
) {
}
