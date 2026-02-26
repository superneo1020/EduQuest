package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
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

    public UserProfileDto toProfile(Page<UserGameScoreDto> userGameScores) {
        return new UserProfileDto(
                userGameScores.getContent(),
                userGameScores.getPageable().getPageNumber(),
                userGameScores.getTotalPages(),
                userGameScores.getTotalElements(),
                userGameScores.hasNext(),
                userGameScores.hasPrevious()
        );
    }

    public LeaderboardDto toLeaderboard(Slice<LeaderboardScoreDto> leaderboardScores) {
        return new LeaderboardDto(
                leaderboardScores.getContent(),
                leaderboardScores.getPageable().getPageNumber(),
                leaderboardScores.hasNext(),
                leaderboardScores.hasPrevious()
        );
    }

    private List<String> mapRoles(Collection<Role> roles) {
        return roles.stream()
                .map(Role::getName)
                .toList();
    }
}
