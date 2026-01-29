package com.eduquest.springbackend.dto;

import java.util.List;

public record UserDto(
        String username,
        String email,
        Integer points,
        List<String> roles
) {
}
