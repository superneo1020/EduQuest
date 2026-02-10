package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dto.UserDto;
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

@Service
public class UserDtoMapper {

    public UserDto toUser(AppUser user) {
        if (user == null) return null;
        return  new UserDto(
                user.getUsername(),
                user.getEmail(),
                user.getPoints(),
                mapRoles(user.getRoles())
        );
    }

    public UserProfileDto toProfile(Page<UserGameScore> userGameScores) {
        if (userGameScores == null) return null;
        return new UserProfileDto(
                mapGameScores(userGameScores.getContent()),
                userGameScores.getPageable().getPageNumber(),
                userGameScores.getTotalPages(),
                userGameScores.getTotalElements(),
                userGameScores.hasNext(),
                userGameScores.hasPrevious()
        );
    }

    public UserGameScoreDto toGameScore(UserGameScore userGameScore) {
        if (userGameScore == null || userGameScore.getGame() == null) return null;
        Game game = userGameScore.getGame();
        return new UserGameScoreDto(
                game.getName(),
                game.getType(),
                game.getDifficulty(),
                game.getIcon(),
                game.getDescription(),
                userGameScore.getScores(),
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
                .toList();
    }
}
