package com.eduquest.springbackend.exception;

public class RuleViolationException extends RuntimeException {
    public RuleViolationException(String message) {
        super(message);
    }
}
