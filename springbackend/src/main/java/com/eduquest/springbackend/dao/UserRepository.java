package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT u.id FROM AppUser u WHERE u.username = :username")
    Optional<Long> findIdByUsername(@Param("username") String username);
}
