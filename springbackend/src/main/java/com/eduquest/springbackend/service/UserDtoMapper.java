package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
import com.eduquest.springbackend.model.UserGameScore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

@Service
public class UserDtoMapper {

    public UserDto toUser(AppUser user) {
        return new UserDto(
                user.getUsername(),
                user.getEmail(),
                user.getPoints(),
                mapRoles(user.getRoles())
        );
    }

    public UserProfileDto toProfile(Page<UserGameScore> userGameScores) {
        return new UserProfileDto(
                mapGameScores(userGameScores.getContent()),
                userGameScores.getPageable().getPageNumber(),
                userGameScores.getTotalPages(),
                userGameScores.getTotalElements(),
                userGameScores.hasNext(),
                userGameScores.hasPrevious()
        );
    }

    public LeaderboardDto toLeaderboard(Slice<UserGameScore> userGameScores) {
        return new LeaderboardDto(
                mapUserScores(userGameScores.getContent()),
                userGameScores.getPageable().getPageNumber(),
                userGameScores.hasNext(),
                userGameScores.hasPrevious()
        );
    }

    public GameScoreDto fromGameScore(UserGameScore userGameScore) {
        return new GameScoreDto(
                userGameScore.getGame().getName(),
                userGameScore.getGame().getType(),
                userGameScore.getGame().getDifficulty(),
                userGameScore.getGame().getIcon(),
                userGameScore.getGame().getDescription(),
                userGameScore.getScores(),
                userGameScore.getCreatedAt()
        );
    }

    public UserScoreDto fromUserScore(UserGameScore userGameScore) {
        return new UserScoreDto(
                userGameScore.getUser().getUsername(),
                userGameScore.getScores(),
                userGameScore.getCreatedAt()
        );
    }

    private List<String> mapRoles(Collection<Role> roles) {
        return roles.stream()
                .map(Role::getName)
                .toList();
    }

    private List<GameScoreDto> mapGameScores(List<UserGameScore> userGameScores) {
        return userGameScores.stream()
                .map(this::fromGameScore)
                .toList();
    }

    private List<UserScoreDto> mapUserScores(List<UserGameScore> userGameScores) {
        return userGameScores.stream()
                .map(this::fromUserScore)
                .toList();
    }
}
