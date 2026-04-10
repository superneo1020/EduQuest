package com.eduquest.springbackend.exception;

public class NotActivatedException extends RuntimeException {
    public NotActivatedException(String message) {
        super(message);
    }
}
