package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dto.UserGameScoreDto;
import com.eduquest.springbackend.dto.UserProfileDto;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Game;
import com.eduquest.springbackend.model.Role;
import com.eduquest.springbackend.model.UserGameScore;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserDtoMapper {

    public UserProfileDto toProfile(AppUser user, Page<UserGameScore> userGameScores) {
        if (user == null) return null;
        return new UserProfileDto(
                user.getUsername(),
                user.getEmail(),
                mapRoles(user.getRoles()),
                mapGameScores(user.getUserGameScores()),
                userGameScores.getPageable().getPageNumber(),
                userGameScores.getTotalPages(),
                userGameScores.getTotalElements(),
                userGameScores.hasNext(),
                userGameScores.hasPrevious()
        );
    }

    public UserGameScoreDto toGameScore(UserGameScore userGameScore) {
        Game game = userGameScore.getGame();
        if (game == null) return null;
        return new UserGameScoreDto(
                game.getName(),
                game.getType(),
                game.getDifficulty(),
                game.getIcon(),
                game.getDescription(),
                userGameScore.getScores(),
                userGameScore.getPoints(),
                userGameScore.getCreatedAt()
        );
    }

    private List<String> mapRoles(Collection<Role> roles) {
        return roles.stream()
                .map(Role::getName)
                .toList();
    }

    private List<UserGameScoreDto> mapGameScores(List<UserGameScore> userGameScores) {
        return userGameScores.stream()
                .map(this::toGameScore)
                .collect(Collectors.toList());
    }
}
