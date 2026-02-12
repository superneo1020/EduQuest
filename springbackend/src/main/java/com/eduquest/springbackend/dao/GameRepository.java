package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface GameRepository extends JpaRepository<Game, Long> {
    @Query("SELECT u.id FROM Game u WHERE u.name = :name")
    Optional<Long> findIdByName(@Param("name") String name);
}
