package com.eduquest.springbackend.dto;

import java.time.LocalDate;

public record UserMissionDto(
        String type,
        String name,
        String difficulty,
        String icon,
        String description,
        Integer scores,
        LocalDate date
) {
}
