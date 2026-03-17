package com.eduquest.springbackend.service;

import com.eduquest.springbackend.Util.PageableUtils;
import com.eduquest.springbackend.dao.GameRepository;
import com.eduquest.springbackend.dao.UserGameScoreRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Game;
import com.eduquest.springbackend.model.UserGameScore;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class UserGameScoreService {

    private final UserGameScoreRepository userGameScoreRepo;
    private final UserRepository userRepo;
    private final GameRepository gameRepo;

    private final UserDtoMapper userDtoMapper;

    private final Set<String> LEADERBOARD_SCORE_DTO_FIELD = Set.of(
            "username", "scores", "createdAt"
    );

    private final Set<String> USER_PROFILE_DTO_FIELD = Set.of(
            "gameName", "gameType", "gameDifficulty", "gameIcon", "gameDescription", "scores", "createdAt"
    );


    public UserGameScoreService(UserGameScoreRepository userGameScoreRepo,
                                UserRepository userRepo,
                                GameRepository gameRepo,
                                UserDtoMapper userDtoMapper
    ) {
        this.userGameScoreRepo = userGameScoreRepo;
        this.userRepo = userRepo;
        this.gameRepo = gameRepo;
        this.userDtoMapper = userDtoMapper;
    }

    @Transactional
    public UserGameScoreResponse createUserGameScore(String username, UserGameScoreRequest req) {

        AppUser user = userRepo.getReferenceByUsername(username).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + username));
        Game game = gameRepo.getReferenceByName(req.gameName()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found: " + req.gameName()));

        UserGameScore userGameScore = new UserGameScore(user, game, req.scores());
        UserGameScore savedScore = userGameScoreRepo.save(userGameScore);

        return new UserGameScoreResponse(
                savedScore.getId(),
                savedScore.getScores(),
                savedScore.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public LeaderboardDto showLeaderboard(String gameName, Pageable pageable) {
        Pageable cleanPageable = PageableUtils.filterSort(pageable, LEADERBOARD_SCORE_DTO_FIELD);
        var slice = userGameScoreRepo.findAllHighestScoresByGameName(gameName, cleanPageable);
        return userDtoMapper.toLeaderboard(slice);
    }

    @Transactional(readOnly = true)
    public UserGameRecordDto showGameRecord(String username, Pageable pageable) {
        Pageable cleanPageable = PageableUtils.filterSort(pageable, USER_PROFILE_DTO_FIELD);
        var page = userGameScoreRepo.findUserGameScoresByUserUsername(username, cleanPageable);
        return userDtoMapper.toGameRecord(page);
    }

    @Transactional(readOnly = true)
    public UserGameRecordDto showGameRecord(String username, Pageable pageable, String gameName) {
        Pageable cleanPageable = PageableUtils.filterSort(pageable, USER_PROFILE_DTO_FIELD);
        var page = userGameScoreRepo.findUserGameScoresByUserUsernameAndGameName(username, gameName, cleanPageable);
        return userDtoMapper.toGameRecord(page);
    }

    @Transactional(readOnly = true)
    public List<UserGameScoreDto> showBestGameRecord(String username) {
        return userGameScoreRepo.findAllHighestScoresByUserUsername(username);
    }

    @Transactional(readOnly = true)
    public UserGameScoreDto showBestGameRecord(String username, String gameName) {
        return userGameScoreRepo.findHighestScoresByUserUsernameAndGameName(username, gameName);
    }
}
