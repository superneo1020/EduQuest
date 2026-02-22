package com.eduquest.springbackend.exception;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.beans.TypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private ExceptionDto toException(HttpStatus status, String message) {
        return new ExceptionDto(
                Instant.now().toString(),
                status.value(),
                status.getReasonPhrase(),
                message
        );
    }

    private ExceptionMultiLineDto toExceptionWithMultiLine(HttpStatus status, Map<String, String> message) {
        return new ExceptionMultiLineDto(
                Instant.now().toString(),
                status.value(),
                status.getReasonPhrase(),
                message
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ExceptionDto> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(toException(HttpStatus.BAD_REQUEST, e.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ExceptionDto> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(toException(HttpStatus.CONFLICT, e.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ExceptionDto> handleBadCredentials(BadCredentialsException e) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(toException(HttpStatus.UNAUTHORIZED, e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ExceptionMultiLineDto> handleMethodArgumentNotValid(MethodArgumentNotValidException e) {
        Map<String, String> errors = e.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        field -> field.getDefaultMessage() != null ? field.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing
                ));
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(toExceptionWithMultiLine(HttpStatus.BAD_REQUEST, errors));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ExceptionDto> handleDuplicateResourceResource(DuplicateResourceException e) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(toException(HttpStatus.CONFLICT, e.getMessage()));
    }

    @ExceptionHandler(JwtValidationException.class)
    public ResponseEntity<ExceptionDto> handleJwtValidation(JwtValidationException e) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(toException(HttpStatus.UNAUTHORIZED, e.getMessage()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ExceptionMultiLineDto> handleConstraintViolation(ConstraintViolationException e) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (ConstraintViolation<?> violation : e.getConstraintViolations()) {
            String path = violation.getPropertyPath().toString();
            errors.put(path, violation.getMessage());
        }
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(toExceptionWithMultiLine(HttpStatus.BAD_REQUEST, errors));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ExceptionMultiLineDto> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String name = ex.getName(); // parameter name, e.g. "page"
        String value = ex.getValue() != null ? ex.getValue().toString() : "null";
        String expectedType = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown";
        Map<String, String> errors = Map.of(name, String.format("Failed to convert value '%s' to type %s", value, expectedType));
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(toExceptionWithMultiLine(HttpStatus.BAD_REQUEST, errors));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ExceptionMultiLineDto> handleMissingParam(MissingServletRequestParameterException e) {
        Map<String, String> errors = Map.of(e.getParameterName(), "Required request parameter is missing");
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(toExceptionWithMultiLine(HttpStatus.BAD_REQUEST, errors));
    }

    @ExceptionHandler(TypeMismatchException.class)
    public ResponseEntity<ExceptionMultiLineDto> handleTypeMismatch(TypeMismatchException e) {
        String name = e.getPropertyName() != null ? e.getPropertyName() : "null";
        String value = e.getValue() != null ? e.getValue().toString() : "null";
        Map<String, String> errors = Map.of(name, String.format("Type mismatch: cannot convert value '%s'", value));
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(toExceptionWithMultiLine(HttpStatus.BAD_REQUEST, errors));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ExceptionDto> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(toException(HttpStatus.NOT_FOUND, e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ExceptionDto> handleException(Exception e) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(toException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage()));
    }
}
