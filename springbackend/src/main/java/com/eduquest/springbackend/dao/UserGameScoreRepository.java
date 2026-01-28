package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.UserGameScore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserGameScoreRepository extends JpaRepository<UserGameScore,Long> {
    Page<UserGameScore> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
