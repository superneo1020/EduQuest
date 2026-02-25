package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.dto.LeaderboardScoreDto;
import com.eduquest.springbackend.dto.UserGameScoreDto;
import com.eduquest.springbackend.model.UserGameScore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserGameScoreRepository extends JpaRepository<UserGameScore,Long> {

    @Query(value = "SELECT g.name AS gameName, g.type AS gameType, g.difficulty AS gameDifficulty, " +
            "g.icon AS gameIcon, g.description AS gameDescription, ugs.scores AS scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN games g ON ugs.game_id = g.id " +
            "WHERE ugs.user_id = :userId " +
            "AND ugs.game_id = :gameId ",
            nativeQuery = true)
    Page<UserGameScoreDto> findUserGameScoresByUserIdAndGameId(@Param("userId") Long userId, @Param("gameId") Long gameId, Pageable pageable);

    @Query(value = "SELECT g.name AS gameName, g.type AS gameType, g.difficulty AS gameDifficulty, " +
            "g.icon AS gameIcon, g.description AS gameDescription, ugs.scores AS scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN games g ON ugs.game_id = g.id " +
            "WHERE ugs.user_id = :userId ",
            nativeQuery = true)
    Page<UserGameScoreDto> findUserGameScoresByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query(value = "SELECT DISTINCT ON (g.id) g.name AS gameName, g.type AS gameType, g.difficulty AS gameDifficulty, " +
            "g.icon AS gameIcon, g.description AS gameDescription, ugs.scores AS scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN games g ON ugs.game_id = g.id " +
            "WHERE ugs.user_id = :userId " +
            "ORDER BY g.id, ugs.scores DESC, ugs.created_at",
            nativeQuery = true)
    List<UserGameScoreDto> findAllHighestScoresByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT DISTINCT ON (g.id) g.name AS gameName, g.type AS gameType, g.difficulty AS gameDifficulty, " +
            "g.icon AS gameIcon, g.description AS gameDescription, ugs.scores AS scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN games g ON ugs.game_id = g.id " +
            "WHERE ugs.user_id = :userId " +
            "AND ugs.game_id = :gameId " +
            "ORDER BY g.id, ugs.scores DESC, ugs.created_at",
            nativeQuery = true)
    UserGameScoreDto findHighestScoresByUserIdAndGameId(@Param("userId") Long userId, @Param("gameId") Long gameId);

    @Query(value = "SELECT u.username AS username, ugs.scores AS scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN users u ON ugs.user_id = u.id " +
            "WHERE ugs.game_id = :gameId " +
            "AND ugs.id IN ( " +
            "   SELECT DISTINCT ON (user_id) id FROM user_game_scores " +
            "   WHERE game_id = :gameId " +
            "   ORDER BY user_id, scores DESC, created_at " +
            ") " +
            "ORDER BY ugs.scores DESC, ugs.created_at ",
            nativeQuery = true)
    Slice<LeaderboardScoreDto> findAllHighestScoresByGameId(@Param("gameId") Long gameId, Pageable pageable);
}
