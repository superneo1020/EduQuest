package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.UserGameScore;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserGameScoreRepository extends JpaRepository<UserGameScore,Long> {
}
