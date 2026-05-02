package com.eduquest.springbackend.dao;

import com.eduquest.springbackend.dto.CourseMemberDto;
import com.eduquest.springbackend.enums.RoleInClass;
import com.eduquest.springbackend.model.CourseMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseMemberRepository extends JpaRepository<CourseMember, Long> {
    boolean existsByCourseIdAndUserId(Long courseId, Long userId);
    boolean existsByCourseIdAndUserIdAndRoleInClassIn(Long id, Long userId, List<RoleInClass> roleInClass);
    boolean existsByCourseIdAndUserIdAndRoleInClass(Long courseId, Long userId, RoleInClass roleInClass);
    long deleteByCourseIdAndUserId(Long courseId, Long userId);
    long countByCourseIdAndRoleInClass(Long courseId, RoleInClass roleInClass);
    Optional<CourseMember> findByCourseIdAndUserId(Long courseId, Long userId);

    @Query("SELECT new com.eduquest.springbackend.dto.CourseMemberDto(" +
            "u.id, u.username, u.email, u.points, cm.createdAt, cm.updatedAt, cm.roleInClass" +
            ") " +
            "FROM CourseMember cm " +
            "JOIN cm.user u " +
            "WHERE cm.course.id = :courseId ")
    List<CourseMemberDto> findUserByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT cm.roleInClass FROM CourseMember cm WHERE cm.user.id = :userId AND cm.course.id = :courseId")
    Optional<String> findRoleInClassByUserIdAndCourseId(@Param("userId") Long userId,
                                                        @Param("courseId") Long courseId);
}
