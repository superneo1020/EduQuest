package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.UserGameScoreRequest;
import com.eduquest.springbackend.service.AiAnalysisService;
import com.eduquest.springbackend.service.AppUserDetails;
import com.eduquest.springbackend.service.UserGameScoreService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/game")
public class UserGameController {

    private final UserGameScoreService userGameScoreService;
    private final AiAnalysisService aiAnalysisService;

    public UserGameController(UserGameScoreService userGameScoreService, AiAnalysisService aiAnalysisService) {
        this.userGameScoreService = userGameScoreService;
        this.aiAnalysisService = aiAnalysisService;
    }

    /**
     * Retrieves the current user's game scores.
     * Returns score history for all games or a specific game if name is provided.
     */
    @GetMapping({"/score", "/{name}/score"})
    public ResponseEntity<?> getMyGameScore(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable(required = false) String name,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return name != null
                ? ResponseEntity.ok(userGameScoreService.showGameRecord(userDetails.getId(), pageable, name))
                : ResponseEntity.ok(userGameScoreService.showGameRecord(userDetails.getId(), pageable));
    }

    /**
     * Retrieves the current user's best game scores.
     * Returns highest scores for all games or a specific game if name is provided.
     */
    @GetMapping({"/best", "/{name}/best"})
    public ResponseEntity<?> getMyBestGameScore(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable(required = false) String name
    ) {
        return name != null
                ? ResponseEntity.ok(userGameScoreService.showBestGameRecord(userDetails.getId(), name))
                : ResponseEntity.ok(userGameScoreService.showBestGameRecord(userDetails.getId()));
    }

    /**
     * Retrieves the school leaderboard for a specific game.
     * Returns ranked list of players from the user's school for the specified game.
     */
    @GetMapping("/{name}/leaderboard/school")
    public ResponseEntity<?> getSchoolLeaderboard(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable String name,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(userGameScoreService.showLeaderboardBySchool(userDetails.getId(), name, pageable));
    }

    /**
     * Retrieves the class leaderboard for a specific game.
     * Returns ranked list of players from a specific class for the specified game.
     */
    @GetMapping("/{name}/leaderboard/class/{classId}")
    @PreAuthorize("@courseMemberSecurity.isCourseMember(#classId)")
    public ResponseEntity<?> getClassLeaderboard(
            @PathVariable String name,
            @PathVariable Long classId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(userGameScoreService.showLeaderboardByClass(classId, name, pageable));
    }

    /**
     * Creates a new game score record for the current user.
     * Records the user's performance in a specific game session.
     */
    @PostMapping("/score")
    public ResponseEntity<?> createMyGameScore(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @Valid @RequestBody UserGameScoreRequest request
    ) {
        return ResponseEntity.ok(userGameScoreService.createUserGameScore(userDetails.getId(), request));
    }

    /**
     * Generates AI analysis of the user's game performance.
     * Returns insights and trends based on recent game scores or specific game data.
     */
    @GetMapping({"/results", "/results/{gameId}"})
    public ResponseEntity<?> aiAnalysisWithMyGameScore(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable(required = false) Long gameId,
            @PageableDefault(size = 100) Pageable pageable
    ) {
        return gameId != null
                ? ResponseEntity.ok(aiAnalysisService.analyzeGame(gameId, userDetails.getId(), pageable))
                : ResponseEntity.ok(aiAnalysisService.analyzeGameDaily(userDetails.getId(), pageable));
    }
}
