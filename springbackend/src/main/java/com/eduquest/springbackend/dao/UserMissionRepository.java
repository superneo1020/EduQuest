package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.dto.UserMissionDto;
import com.eduquest.springbackend.model.UserMission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserMissionRepository extends JpaRepository<UserMission,Long> {
    @Query(value = "SELECT new com.eduquest.springbackend.dto.UserMissionDto( " +
            "m.type, m.name, m.difficulty, m.icon, m.description, m.scores, um.date" +
            ") " +
            "FROM UserMission um " +
            "JOIN um.mission m " +
            "WHERE um.user.id = :userId " +
            "AND um.completed = :completed ")
    List<UserMissionDto> findAllByUserIdAndCompleted(
            @Param("userId") Long userId,
            @Param("completed") Boolean completed
    );

    Boolean existsByUserIdAndMissionIdAndCompletedIsFalse(Long userId, Long missionId);
}
