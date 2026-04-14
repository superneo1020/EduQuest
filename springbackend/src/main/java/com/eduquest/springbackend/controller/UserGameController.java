package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.UserGameScoreRequest;
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

    public UserGameController(UserGameScoreService userGameScoreService) {
        this.userGameScoreService = userGameScoreService;
    }

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

    @GetMapping({"/best", "/{name}/best"})
    public ResponseEntity<?> getMyBestGameScore(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable(required = false) String name
    ) {
        return name != null
                ? ResponseEntity.ok(userGameScoreService.showBestGameRecord(userDetails.getId(), name))
                : ResponseEntity.ok(userGameScoreService.showBestGameRecord(userDetails.getId()));
    }

    @GetMapping("/{name}/leaderboard/school")
    public ResponseEntity<?> getSchoolLeaderboard(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable String name,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(userGameScoreService.showLeaderboardBySchool(userDetails.getId(), name, pageable));
    }

    @GetMapping("/{name}/leaderboard/class/{classId}")
    @PreAuthorize("@courseMemberSecurity.isCourseMember(#classId)")
    public ResponseEntity<?> getClassLeaderboard(
            @PathVariable String name,
            @PathVariable Long classId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(userGameScoreService.showLeaderboardByClass(classId, name, pageable));
    }

    @PostMapping("/score")
    public ResponseEntity<?> createMyGameScore(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @Valid @RequestBody UserGameScoreRequest request
    ) {
        return ResponseEntity.ok(userGameScoreService.createUserGameScore(userDetails.getId(), request));
    }
}
