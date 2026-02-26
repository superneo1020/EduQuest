package com.eduquest.springbackend.service;

import com.eduquest.springbackend.Util.PageableUtils;
import com.eduquest.springbackend.dao.GameRepository;
import com.eduquest.springbackend.dao.UserGameScoreRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.LeaderboardDto;
import com.eduquest.springbackend.dto.LeaderboardScoreDto;
import com.eduquest.springbackend.dto.UserGameScoreRequest;
import com.eduquest.springbackend.dto.UserGameScoreResponse;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Game;
import com.eduquest.springbackend.model.UserGameScore;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

@Service
public class UserGameScoreService {

    private final UserGameScoreRepository userGameScoreRepository;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final EntityManager entityManager;
    private final UserDtoMapper userDtoMapper;

    private final Set<String> LEADERBOARD_SCORE_DTO_FIELD = Set.of(
            "username", "scores", "createdAt"
    );

    public UserGameScoreService(UserGameScoreRepository userGameScoreRepository,
                                UserRepository userRepository,
                                GameRepository gameRepository,
                                EntityManager entityManager,
                                UserDtoMapper userDtoMapper) {
        this.userGameScoreRepository = userGameScoreRepository;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.entityManager = entityManager;
        this.userDtoMapper = userDtoMapper;
    }

    @Transactional
    public UserGameScoreResponse saveUserGameScore(UserDetails userDetails, UserGameScoreRequest req) {
        AppUser user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Game game = gameRepository.findById(req.gameId())
                .orElseThrow(() -> new RuntimeException("Game not found"));

        UserGameScore userGameScore = new UserGameScore(user, game, req.scores());
        UserGameScore savedScore = userGameScoreRepository.save(userGameScore);
        entityManager.refresh(user);

        return new UserGameScoreResponse(
                savedScore.getId(),
                user.getId(),
                game.getId(),
                game.getType(),
                game.getDifficulty(),
                savedScore.getScores(),
                savedScore.getCreatedAt(),
                user.getPoints()
        );
    }

    @Transactional(readOnly = true)
    public LeaderboardDto showLeaderboard(String gameName, Pageable pageable) {
        Long gameId = gameRepository.findIdByName(gameName).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));

        Pageable cleanPageable = PageableUtils.filterSort(pageable, LEADERBOARD_SCORE_DTO_FIELD);

        Slice<LeaderboardScoreDto> slice = userGameScoreRepository.findAllHighestScoresByGameId(gameId, cleanPageable);

        return userDtoMapper.toLeaderboard(slice);
    }
}
