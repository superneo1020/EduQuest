package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dao.GameRepository;
import com.eduquest.springbackend.dto.GameDto;
import com.eduquest.springbackend.model.Game;
import com.eduquest.springbackend.service.UserGameScoreService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final UserGameScoreService userGameScoreService;
    private final GameRepository gameRepository;

    public GameController(UserGameScoreService userGameScoreService, GameRepository gameRepository) {
        this.userGameScoreService = userGameScoreService;
        this.gameRepository = gameRepository;
    }

    @GetMapping("/games")
    public ResponseEntity<List<GameDto>> getAllGames() {
        List<Game> games = gameRepository.findAll();
        List<GameDto> gameDtos = games.stream()
                .map(game -> new GameDto(
                        game.getId(),
                        game.getType(),
                        game.getName(),
                        game.getDifficulty(),
                        game.getIcon(),
                        game.getDescription()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(gameDtos);
    }

    @GetMapping("/{name}/leaderboard")
    public ResponseEntity<?> getLeaderboard(
            @PathVariable String name,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(userGameScoreService.showLeaderboard(name, pageable));
    }
}
