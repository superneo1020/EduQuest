package com.eduquest.springbackend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HelloController {

    /**
     * Simple health check endpoint.
     * Returns a greeting message to verify the API is running.
     */
    @GetMapping("/hello")
    public String sayHello() {
        return "Hello World from Spring Boot!";
    }
}
