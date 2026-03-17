package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.UserGameScoreRequest;
import com.eduquest.springbackend.service.UserGameScoreService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable(required = false) String name,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return name != null
                ? ResponseEntity.ok(userGameScoreService.showGameRecord(userDetails.getUsername(), pageable, name))
                : ResponseEntity.ok(userGameScoreService.showGameRecord(userDetails.getUsername(), pageable));
    }

    @GetMapping({"/best", "/{name}/best"})
    public ResponseEntity<?> getMyBestGameScore(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable(required = false) String name
    ) {
        return name != null
                ? ResponseEntity.ok(userGameScoreService.showBestGameRecord(userDetails.getUsername(), name))
                : ResponseEntity.ok(userGameScoreService.showBestGameRecord(userDetails.getUsername()));
    }

    @PostMapping("/score")
    public ResponseEntity<?> createMyGameScore(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserGameScoreRequest request
    ) {
        return ResponseEntity.ok(userGameScoreService.createUserGameScore(userDetails.getUsername(), request));
    }
}
