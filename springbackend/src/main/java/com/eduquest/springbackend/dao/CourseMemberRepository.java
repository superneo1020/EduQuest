package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.dto.CourseDto;
import com.eduquest.springbackend.dto.CourseMemberDto;
import com.eduquest.springbackend.model.CourseMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseMemberRepository extends JpaRepository<CourseMember, Long> {
    @Query("SELECT new com.eduquest.springbackend.dto.CourseDto(" +
            "c.id, c.grade, c.suffix, c.academicYear, c.createdAt" +
            ") " +
            "FROM CourseMember cm " +
            "JOIN cm.course c " +
            "WHERE cm.user.id = :id")
    List<CourseDto> findCourseByUserId(Long id);

    @Query("SELECT new com.eduquest.springbackend.dto.CourseMemberDto(" +
            "cm.id, cm.roleInClass, u.id, u.username, u.email" +
            ") " +
            "FROM CourseMember cm " +
            "JOIN cm.user u " +
            "WHERE cm.course.id = :courseId " +
            "AND cm.user.id = :userId")
    List<CourseMemberDto> findCourseByCourseId(@Param("userId")Long userId, @Param("courseId")Long courseId);

    List<CourseMember> findUserByCourseId(Long id);

    @Query("SELECT cm.roleInClass FROM CourseMember cm WHERE cm.user.id = :userId AND cm.course.id = :courseId")
    Optional<String> findRoleInClassByUserIdAndCourseId(Long userId, Long courseId);
}
