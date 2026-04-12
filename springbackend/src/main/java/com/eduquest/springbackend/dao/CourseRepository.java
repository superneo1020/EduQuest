package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.dto.CourseDto;
import com.eduquest.springbackend.model.Course;
import com.eduquest.springbackend.model.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    boolean existsBySchoolAndGradeAndSuffixAndAcademicYear(School school, String grade, String suffix, String academicYear);

    @Query("SELECT new com.eduquest.springbackend.dto.CourseDto(" +
            "c.id, c.school.id, c.grade, c.suffix, c.academicYear, c.createdAt, c.updatedAt" +
            ") " +
            "FROM Course c " +
            "JOIN AppUser u ON u.school.id = c.school.id " +
            "WHERE u.id = :user_id")
    List<CourseDto> findAllAvailableCoursesByHomeSchool(@Param("user_id") Long user_id);

    @Query("SELECT new com.eduquest.springbackend.dto.CourseDto(" +
            "c.id, c.school.id, c.grade, c.suffix, c.academicYear, c.createdAt, c.updatedAt" +
            ") " +
            "FROM CourseMember cm " +
            "JOIN cm.course c " +
            "WHERE cm.user.id = :user_id")
    List<CourseDto> findAllCourseByUserId(@Param("user_id") Long user_id);
}
