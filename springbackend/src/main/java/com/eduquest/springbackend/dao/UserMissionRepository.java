package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.dto.UserMissionDto;
import com.eduquest.springbackend.model.UserMission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserMissionRepository extends JpaRepository<UserMission,Long> {
    @Query(value = "SELECT new com.eduquest.springbackend.dto.UserMissionDto( " +
            "m.type, m.name, m.difficulty, m.icon, m.description, m.scores, um.date" +
            ") " +
            "FROM UserMission um " +
            "JOIN Mission m ON m.id = um.mission.id " +
            "WHERE um.user.id = :userId " +
            "AND um.completed = :completed ")
    List<UserMissionDto> findAllByUserIdAndCompleted(Long userId, Boolean completed);

    Boolean existsByUserIdAndMissionIdAndCompletedIsFalse(Long userId, Long missionId);
}
