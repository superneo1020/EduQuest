package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.GameRepository;
import com.eduquest.springbackend.dao.UserGameScoreRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.*;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Game;
import com.eduquest.springbackend.model.UserGameScore;
import com.eduquest.springbackend.util.PageableUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
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


    public UserGameScoreService(UserGameScoreRepository userGameScoreRepo,
                                UserRepository userRepo,
                                GameRepository gameRepo,
                                DtoMapper dtoMapper,
                                GameService gameService) {
        this.userGameScoreRepo = userGameScoreRepo;
        this.userRepo = userRepo;
        this.gameRepo = gameRepo;
        this.dtoMapper = dtoMapper;
        this.gameService = gameService;
    }

    @Transactional
    public UserGameScoreResponse createUserGameScore(Long userId, UserGameScoreRequest req) {
        Long gameId = gameService.checkIdByName(req.gameName());

        AppUser user = userRepo.getReferenceById(userId);
        Game game = gameRepo.getReferenceById(gameId);

        GameMetadata cleanMetadata = new GameMetadata(
                req.metadata().questions() != null ? req.metadata().questions() : List.of(),
                req.metadata().extraData() != null ? req.metadata().extraData() : Map.of()
        );

        UserGameScore userGameScore = new UserGameScore(user, game, req.scores(), cleanMetadata);
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
    public UtilSliceResponse<LeaderboardScoreDto> showLeaderboardBySchool(Long userId, String gameName, Pageable pageable) {
        Pageable cleanPageable = PageableUtils.filterSort(pageable, LEADERBOARD_SCORE_DTO_FIELD);
        Long schoolId = userRepo.findSchoolIdById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        Long gameId = gameService.checkIdByName(gameName);
        var slice = userGameScoreRepo.findAllHighestScoresByGameIdAndSchoolId(gameId, schoolId, cleanPageable);
        return dtoMapper.toSliceResponse(slice);
    }

    @Transactional(readOnly = true)
    public UtilSliceResponse<LeaderboardScoreDto> showLeaderboardByClass(Long classId, String gameName, Pageable pageable) {
        Pageable cleanPageable = PageableUtils.filterSort(pageable, LEADERBOARD_SCORE_DTO_FIELD);
        Long gameId = gameService.checkIdByName(gameName);
        var slice = userGameScoreRepo.findAllHighestScoresByGameIdAndClassId(gameId, classId, cleanPageable);
        return dtoMapper.toSliceResponse(slice);
    }

    @Transactional(readOnly = true)
    public UtilPageResponse<UserGameScoreDto> showGameRecord(Long userId, Pageable pageable) {
        Pageable cleanPageable = PageableUtils.filterSort(pageable, USER_PROFILE_DTO_FIELD);
        var page = userGameScoreRepo.findUserGameScoresByUserId(userId, cleanPageable);
        return dtoMapper.toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public UtilPageResponse<UserGameScoreDto> showGameRecord(Long userId, Pageable pageable, String gameName) {
        Pageable cleanPageable = PageableUtils.filterSort(pageable, USER_PROFILE_DTO_FIELD);
        Long gameId = gameService.checkIdByName(gameName);
        var page = userGameScoreRepo.findUserGameScoresByUserIdAndGameId(userId, gameId, cleanPageable);
        return dtoMapper.toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public List<UserGameScoreDto> showBestGameRecord(Long userId) {
        return userGameScoreRepo.findAllHighestScoresByUserId(userId);
    }

    @Transactional(readOnly = true)
    public UserGameScoreDto showBestGameRecord(Long userId, String gameName) {
        Long gameId = gameService.checkIdByName(gameName);
        return userGameScoreRepo.findHighestScoresByUserIdAndGameId(userId, gameId);
    }
}
