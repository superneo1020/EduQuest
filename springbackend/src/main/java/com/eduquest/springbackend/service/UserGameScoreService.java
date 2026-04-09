package com.eduquest.springbackend.service;

import com.eduquest.springbackend.util.PageableUtils;
import com.eduquest.springbackend.dao.GameRepository;
import com.eduquest.springbackend.dao.UserGameScoreRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Game;
import com.eduquest.springbackend.model.UserGameScore;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class UserGameScoreService {

    private final UserGameScoreRepository userGameScoreRepo;
    private final UserRepository userRepo;
    private final GameRepository gameRepo;

    private final DtoMapper dtoMapper;

    private final Set<String> LEADERBOARD_SCORE_DTO_FIELD = Set.of(
            "username", "scores", "createdAt"
    );

    private final Set<String> USER_PROFILE_DTO_FIELD = Set.of(
            "name", "type", "difficulty", "icon", "description", "scores", "createdAt"
    );

    private final GameService gameService;
    private final UserService userService;


    public UserGameScoreService(UserGameScoreRepository userGameScoreRepo,
                                UserRepository userRepo,
                                GameRepository gameRepo,
                                DtoMapper dtoMapper,
                                GameService gameService,
                                UserService userService) {
        this.userGameScoreRepo = userGameScoreRepo;
        this.userRepo = userRepo;
        this.gameRepo = gameRepo;
        this.dtoMapper = dtoMapper;
        this.gameService = gameService;
        this.userService = userService;
    }

    @Transactional
    public UserGameScoreResponse createUserGameScore(String username, UserGameScoreRequest req) {

        Long userId = userService.checkIdByUsername(username);
        Long gameId = gameService.checkIdByName(req.gameName());

        AppUser user = userRepo.getReferenceById(userId);
        Game game = gameRepo.getReferenceById(gameId);

        UserGameScore userGameScore = new UserGameScore(user, game, req.scores());
        UserGameScore savedScore = userGameScoreRepo.save(userGameScore);

        return new UserGameScoreResponse(
                savedScore.getId(),
                savedScore.getScores(),
                savedScore.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public UtilSliceResponse<LeaderboardScoreDto> showLeaderboard(String gameName, Pageable pageable) {
        Pageable cleanPageable = PageableUtils.filterSort(pageable, LEADERBOARD_SCORE_DTO_FIELD);
        Long gameId = gameService.checkIdByName(gameName);
        var slice = userGameScoreRepo.findAllHighestScoresByGameId(gameId, cleanPageable);
        return dtoMapper.toSliceResponse(slice);
    }

    @Transactional(readOnly = true)
    public UtilPageResponse<UserGameScoreDto> showGameRecord(String username, Pageable pageable) {
        Pageable cleanPageable = PageableUtils.filterSort(pageable, USER_PROFILE_DTO_FIELD);
        Long userId = userService.checkIdByUsername(username);
        var page = userGameScoreRepo.findUserGameScoresByUserId(userId, cleanPageable);
        return dtoMapper.toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public UtilPageResponse<UserGameScoreDto> showGameRecord(String username, Pageable pageable, String gameName) {
        Pageable cleanPageable = PageableUtils.filterSort(pageable, USER_PROFILE_DTO_FIELD);
        Long userId = userService.checkIdByUsername(username);
        Long gameId = gameService.checkIdByName(gameName);
        var page = userGameScoreRepo.findUserGameScoresByUserIdAndGameId(userId, gameId, cleanPageable);
        return dtoMapper.toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public List<UserGameScoreDto> showBestGameRecord(String username) {
        Long userId = userService.checkIdByUsername(username);
        return userGameScoreRepo.findAllHighestScoresByUserId(userId);
    }

    @Transactional(readOnly = true)
    public UserGameScoreDto showBestGameRecord(String username, String gameName) {
        Long userId = userService.checkIdByUsername(username);
        Long gameId = gameService.checkIdByName(gameName);
        return userGameScoreRepo.findHighestScoresByUserIdAndGameId(userId, gameId);
    }
}
