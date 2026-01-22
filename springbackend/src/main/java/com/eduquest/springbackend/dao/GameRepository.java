package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.Game;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameRepository extends JpaRepository<Game, Long> {
}
