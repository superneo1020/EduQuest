package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.GameRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GameService {

    private final GameRepository gameRepo;

    public GameService(GameRepository gameRepo) {
        this.gameRepo = gameRepo;
    }

    @Transactional(readOnly = true)
    public Long checkIdByName(String name) {
        return gameRepo.findIdByName(name).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));
    }
}
