package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dto.UserProfileDto;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
import com.eduquest.springbackend.model.UserGameScore;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class UserDtoMapper {

    public UserProfileDto toProfile(AppUser user) {
        if (user == null) return null;
        return new UserProfileDto(
                user.getUsername(),
                user.getEmail(),
                user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toList()),
                user.getUserGameScores().stream()
                        .map(UserGameScore::getScores)
                        .collect(Collectors.toList()),
                user.getPoints()
        );
    }
}