package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.Mission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionRepository extends JpaRepository<Mission, Long> {
}
