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

    @Query(value = "SELECT g.name, g.type, g.difficulty, g.icon, g.description, " +
            "ugs.scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN games g ON ugs.game_id = g.id " +
            "JOIN users u ON ugs.user_id = u.id " +
            "WHERE u.username = :user " +
            "AND g.name = :game ",
            nativeQuery = true)
    Page<UserGameScoreDto> findUserGameScoresByUserUsernameAndGameName(
            @Param("user") String user,
            @Param("game") String game,
            Pageable pageable
    );

    @Query(value = "SELECT g.name, g.type, g.difficulty, g.icon, g.description, " +
            "ugs.scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN games g ON ugs.game_id = g.id " +
            "JOIN users u ON ugs.user_id = u.id " +
            "WHERE u.username = :username ",
            nativeQuery = true)
    Page<UserGameScoreDto> findUserGameScoresByUserUsername(@Param("username") String username, Pageable pageable);

    @Query(value = "SELECT DISTINCT ON (g.id) g.name, g.type, g.difficulty, g.icon, g.description, " +
            "ugs.scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN games g ON ugs.game_id = g.id " +
            "JOIN users u ON ugs.user_id = u.id " +
            "WHERE u.username = :username " +
            "ORDER BY g.id, ugs.scores DESC, ugs.created_at DESC",
            nativeQuery = true)
    List<UserGameScoreDto> findAllHighestScoresByUserUsername(@Param("username") String username);

    @Query(value = "SELECT DISTINCT ON (g.id) g.name, g.type, g.difficulty, g.icon, g.description, " +
            "ugs.scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN games g ON ugs.game_id = g.id " +
            "JOIN users u ON ugs.user_id = u.id " +
            "WHERE u.username = :user " +
            "AND g.name = :game " +
            "ORDER BY g.id, ugs.scores DESC, ugs.created_at",
            nativeQuery = true)
    UserGameScoreDto findHighestScoresByUserUsernameAndGameName(
            @Param("user") String user,
            @Param("game") String game
    );

    @Query(value = "SELECT u.username, ugs.scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN games g ON ugs.game_id = g.id " +
            "JOIN users u ON ugs.user_id = u.id " +
            "WHERE g.name = :name " +
            "AND ugs.id IN ( " +
            "   SELECT DISTINCT ON (user_id) id FROM user_game_scores " +
            "   WHERE game_id = g.id " +
            "   ORDER BY user_id, scores DESC, created_at " +
            ") " +
            "ORDER BY ugs.scores DESC, ugs.created_at ",
            nativeQuery = true)
    Slice<LeaderboardScoreDto> findAllHighestScoresByGameName(
            @Param("name") String name,
            Pageable pageable
    );
}
