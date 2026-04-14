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

    @Query("SELECT new com.eduquest.springbackend.dto.UserGameScoreDto(" +
            "g.name, g.type, g.difficulty, g.icon, g.description, " +
            "ugs.scores, ugs.metadata, ugs.createdAt) " +
            "FROM UserGameScore ugs JOIN ugs.game g " +
            "WHERE ugs.user.id = :userId " +
            "AND ugs.game.id = :gameId")
    Page<UserGameScoreDto> findUserGameScoresByUserIdAndGameId(
            @Param("userId") Long userId,
            @Param("gameId") Long gameId,
            Pageable pageable
    );

    @Query("SELECT new com.eduquest.springbackend.dto.UserGameScoreDto(" +
            "g.name, g.type, g.difficulty, g.icon, g.description, " +
            "ugs.scores, ugs.metadata, ugs.createdAt) " +
            "FROM UserGameScore ugs JOIN ugs.game g " +
            "WHERE ugs.user.id = :userId")
    Page<UserGameScoreDto> findUserGameScoresByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT new com.eduquest.springbackend.dto.UserGameScoreDto(" +
            "g.name, g.type, g.difficulty, g.icon, g.description, " +
            "ugs.scores, ugs.metadata, ugs.createdAt) " +
            "FROM UserGameScore ugs " +
            "JOIN ugs.game g " +
            "WHERE ugs.user.id = :userId " +
            "AND ugs.scores = (SELECT MAX(ugs2.scores) " +
            "   FROM UserGameScore ugs2 " +
            "   WHERE ugs2.user.id = :userId " +
            "   AND ugs2.game.id = g.id) " +
            "ORDER BY ugs.scores DESC, ugs.createdAt")
    List<UserGameScoreDto> findAllHighestScoresByUserId(@Param("userId") Long userId);

    @Query("SELECT new com.eduquest.springbackend.dto.UserGameScoreDto(" +
            "g.name, g.type, g.difficulty, g.icon, g.description, " +
            "ugs.scores, ugs.metadata, ugs.createdAt) " +
            "FROM UserGameScore ugs " +
            "JOIN ugs.game g " +
            "WHERE ugs.user.id = :userId " +
            "AND g.id = :gameId " +
            "ORDER BY ugs.scores DESC, ugs.createdAt " +
            "LIMIT 1")
    UserGameScoreDto findHighestScoresByUserIdAndGameId(
            @Param("userId") Long userId,
            @Param("gameId") Long gameId
    );

    @Query(value = "SELECT u.username, ugs.scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN users u ON ugs.user_id = u.id " +
            "WHERE ugs.game_id = :gameId " +
            "AND ugs.id IN ( " +
            "   SELECT DISTINCT ON (user_id) id FROM user_game_scores " +
            "   WHERE game_id = ugs.game_id " +
            "   ORDER BY user_id, scores DESC, created_at " +
            ") " +
            "ORDER BY ugs.scores DESC, ugs.created_at",
            nativeQuery = true)
    Slice<LeaderboardScoreDto> findAllHighestScoresByGameId(
            @Param("gameId") Long gameId,
            Pageable pageable
    );

    @Query(value = "SELECT u.username, ugs.scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN users u ON ugs.user_id = u.id " +
            "WHERE ugs.game_id = :gameId " +
            "AND u.school_id = :schoolId " +
            "AND ugs.id IN ( " +
            "   SELECT DISTINCT ON (user_id) id FROM user_game_scores " +
            "   WHERE game_id = ugs.game_id " +
            "   ORDER BY user_id, scores DESC, created_at " +
            ") " +
            "ORDER BY ugs.scores DESC, ugs.created_at",
            nativeQuery = true)
    Slice<LeaderboardScoreDto> findAllHighestScoresByGameIdAndSchoolId(
            @Param("gameId") Long gameId,
            @Param("schoolId") Long schoolId,
            Pageable pageable
    );

    @Query(value = "SELECT u.username, ugs.scores, ugs.created_at AS createdAt " +
            "FROM user_game_scores ugs " +
            "JOIN users u ON ugs.user_id = u.id " +
            "JOIN class_members cm on ugs.user_id = cm.user_id " +
            "WHERE ugs.game_id = :gameId " +
            "AND cm.class_id = :classId " +
            "AND ugs.id IN ( " +
            "   SELECT DISTINCT ON (user_id) id FROM user_game_scores " +
            "   WHERE game_id = ugs.game_id " +
            "   ORDER BY user_id, scores DESC, created_at " +
            ") " +
            "ORDER BY ugs.scores DESC, ugs.created_at",
            nativeQuery = true)
    Slice<LeaderboardScoreDto> findAllHighestScoresByGameIdAndClassId(
            @Param("gameId") Long gameId,
            @Param("classId") Long classId,
            Pageable pageable
    );
}
