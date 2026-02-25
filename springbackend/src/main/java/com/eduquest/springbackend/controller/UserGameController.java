package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.UserGameScoreRequest;
import com.eduquest.springbackend.service.UserGameScoreService;
import com.eduquest.springbackend.service.UserService;
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
    private final UserService userService;
    private final UserGameScoreService userGameScoreService;

    public UserGameController(UserService userService, UserGameScoreService userGameScoreService) {
        this.userService = userService;
        this.userGameScoreService = userGameScoreService;
    }

    @GetMapping({"/score", "/{name}/score"})
    public ResponseEntity<?> getGameScore(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable(required = false) String name,
            @PageableDefault(
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return name != null
                ? ResponseEntity.ok(userService.showProfile(userDetails, pageable, name))
                : ResponseEntity.ok(userService.showProfile(userDetails, pageable));
    }

    @GetMapping({"/best", "/{name}/best"})
    public ResponseEntity<?> getBestGameScore(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable(required = false) String name
    ) {
        return name != null
                ? ResponseEntity.ok(userService.showBestGameRecord(userDetails, name))
                : ResponseEntity.ok(userService.showBestGameRecord(userDetails));
    }

    @PostMapping("/score")
    public ResponseEntity<?> saveGameScore(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserGameScoreRequest request
    ) {
        return ResponseEntity.ok(userGameScoreService.saveUserGameScore(userDetails, request));
    }
}
