package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, Long> {
}
