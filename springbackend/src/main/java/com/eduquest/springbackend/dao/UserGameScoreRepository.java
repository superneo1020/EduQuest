package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.UserGameScore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserGameScoreRepository extends JpaRepository<UserGameScore,Long> {
    @EntityGraph(attributePaths = {"game"})
    Page<UserGameScore> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"game"})
    Page<UserGameScore> findByUserIdAndGameId(Long userId, Long gameId, Pageable pageable);

    @Query(value = "SELECT DISTINCT ON (g.id) ugs.* " +
            "FROM user_game_scores ugs " +
            "JOIN games g ON ugs.game_id = g.id " +
            "WHERE ugs.user_id = :userId " +
            "ORDER BY g.id, ugs.scores DESC, ugs.created_at",
            nativeQuery = true)
    List<UserGameScore> findAllHighestScoresByUserIdAsDto(@Param("userId") Long userId);

    @Query(value = "SELECT DISTINCT ON (g.id) ugs.* " +
            "FROM user_game_scores ugs " +
            "JOIN games g ON ugs.game_id = g.id " +
            "WHERE ugs.user_id = :userId " +
            "AND ugs.game_id = :gameId " +
            "ORDER BY g.id, ugs.scores DESC, ugs.created_at",
            nativeQuery = true)
    List<UserGameScore> findAllHighestScoresByUserIdAndGameIdAsDto(@Param("userId") Long userId,
                                                                   @Param("gameId") Long gameId);
}
