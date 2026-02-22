package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.service.UserGameScoreService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final UserGameScoreService userGameScoreService;

    public GameController(UserGameScoreService userGameScoreService) {
        this.userGameScoreService = userGameScoreService;
    }

    @GetMapping("/{name}/leaderboard")
    public ResponseEntity<?> leaderboard(
            @PathVariable String name,
            @PageableDefault(
                    sort = "created_at",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return ResponseEntity.ok(userGameScoreService.showLeaderboard(name, pageable));
    }
}
