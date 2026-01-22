package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.UserMission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserMissionRepository extends JpaRepository<UserMission,Long> {
}
