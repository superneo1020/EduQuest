package com.eduquest.springbackend.exception;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.TypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    private ProblemDetail createProblemDetail(HttpStatus status, String title, String detail) {
        ProblemDetail pb = ProblemDetail.forStatusAndDetail(status, detail);
        pb.setTitle(title);
        pb.setProperty("timestamp", Instant.now()); // Simple timestamp as requested
        return pb;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        return createProblemDetail(HttpStatus.BAD_REQUEST, "Illegal Argument", ex.getMessage());
    }

    @ExceptionHandler(InsufficientPointsException.class)
    public ProblemDetail handleInsufficientPoints(InsufficientPointsException ex) {
        return createProblemDetail(HttpStatus.BAD_REQUEST, "Insufficient Points", ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex) {
        logger.error("Data integrity violation: {}", ex.getMessage());
        return createProblemDetail(HttpStatus.CONFLICT, "Data Integrity Violation",
                "The operation could not be completed due to a data conflict (e.g. duplicate entry).");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        return createProblemDetail(HttpStatus.UNAUTHORIZED, "Bad Credentials", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleMethodArgumentNotValid(MethodArgumentNotValidException e) {
        ProblemDetail pb = createProblemDetail(HttpStatus.BAD_REQUEST, "Validation Failed", "Errors occurred.");

        Map<String, String> errors = e.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        field -> field.getDefaultMessage() != null ? field.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing
                ));

        pb.setProperty("errors", errors); // Add multi-line errors here
        return pb;
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ProblemDetail handleDuplicateResource(DuplicateResourceException ex) {
        return createProblemDetail(HttpStatus.CONFLICT, "Resource Already Exists", ex.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleResourceNotFound(ResourceNotFoundException ex) {
        return createProblemDetail(HttpStatus.NOT_FOUND, "Resource Not Found", ex.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleEnumError(HttpMessageNotReadableException ex) {
        ProblemDetail problemDetail = createProblemDetail(HttpStatus.BAD_REQUEST, "Enum error", "JSON parse error");

        // for Theme Enum
        if (ex.getMessage().contains("Theme")) {
            problemDetail.setDetail("JSON parse error: Cannot deserialize value of Theme type from request");
            problemDetail.setProperty("acceptedValues", new String[]{"DEFAULT", "LIGHT", "DARK"});
        }

        return problemDetail;
    }

    @ExceptionHandler(JwtValidationException.class)
    public ProblemDetail handleJwtValidation(JwtValidationException e) {
        return createProblemDetail(HttpStatus.UNAUTHORIZED, "Unauthorized", e.getMessage());
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail handleConstraintViolation(ConstraintViolationException e) {
        ProblemDetail pb = createProblemDetail(HttpStatus.BAD_REQUEST, "Constraint Violation", "Invalid parameters.");

        Map<String, String> errors = new LinkedHashMap<>();
        e.getConstraintViolations().forEach(v -> errors.put(v.getPropertyPath().toString(), v.getMessage()));

        pb.setProperty("errors", errors);
        return pb;
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String detail = String.format("Failed to convert value '%s' to type %s", ex.getValue(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");

        ProblemDetail pb = createProblemDetail(HttpStatus.BAD_REQUEST, "Parameter Type Mismatch", detail);
        pb.setProperty("parameter", ex.getName());
        return pb;
    }

    // Missing Required Request Parameter
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ProblemDetail handleMissingParam(MissingServletRequestParameterException e) {
        ProblemDetail pb = createProblemDetail(
                HttpStatus.BAD_REQUEST,
                "Missing Parameter",
                String.format("The required parameter '%s' is missing", e.getParameterName())
        );

        // Adding to the 'errors' map to keep format consistent with your multi-line DTOs
        pb.setProperty("errors", Map.of(e.getParameterName(), "Required request parameter is missing"));
        return pb;
    }

    // General Type Mismatch (e.g. Field assignment issues)
    @ExceptionHandler(TypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(TypeMismatchException e) {
        String name = e.getPropertyName() != null ? e.getPropertyName() : "unknown";
        String value = e.getValue() != null ? e.getValue().toString() : "null";
        String detail = String.format("Type mismatch: cannot convert value '%s' for property '%s'", value, name);

        ProblemDetail pb = createProblemDetail(HttpStatus.BAD_REQUEST, "Type Mismatch", detail);

        pb.setProperty("errors", Map.of(name, String.format("Value '%s' is the wrong type", value)));
        return pb;
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ProblemDetail handleEntityNotFound(EntityNotFoundException e) {
        return createProblemDetail(HttpStatus.NOT_FOUND, "Entity Not Found", e.getMessage());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleResponseStatus(ResponseStatusException e) {
        HttpStatus status = (HttpStatus) e.getStatusCode();
        return createProblemDetail(status, status.getReasonPhrase(), 
                e.getReason() != null ? e.getReason() : "Unexpected error");
    }

    @ExceptionHandler(NotActivatedException.class)
    public ProblemDetail handleNotActivatedException(NotActivatedException ex) {
        return createProblemDetail(HttpStatus.FORBIDDEN, "Account Not Activated", ex.getMessage());
    }

    @ExceptionHandler(RuleViolationException.class)
    public ProblemDetail handleRuleViolationException(RuleViolationException ex) {
        return createProblemDetail(HttpStatus.BAD_REQUEST, "Rule Violation", ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException e) {
        return createProblemDetail(HttpStatus.FORBIDDEN, "Access Denied", e.getMessage());
    }
}
