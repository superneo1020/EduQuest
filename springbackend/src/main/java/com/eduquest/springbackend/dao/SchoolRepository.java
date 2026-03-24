package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SchoolRepository extends JpaRepository<School, Long> {
    Optional<School> findByName(String name);

    @Query("SELECT s.id FROM School s WHERE s.name = :name")
    Optional<Long> findIdByName(@Param("name") String schoolName);
}
