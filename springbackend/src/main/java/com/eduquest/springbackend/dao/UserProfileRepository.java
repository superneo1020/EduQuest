package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
}
