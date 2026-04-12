package com.eduquest.springbackend.service.security;

import com.eduquest.springbackend.dao.CourseMemberRepository;
import com.eduquest.springbackend.enums.RoleInClass;
import com.eduquest.springbackend.service.AppUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("courseMemberSecurity")
public class CourseMemberSecurity {

    private final Logger logger = LoggerFactory.getLogger(this.getClass());
    private final CourseMemberRepository courseMemberRepo;

    public CourseMemberSecurity(CourseMemberRepository courseMemberRepo) {
        this.courseMemberRepo = courseMemberRepo;
    }

    public AppUserDetails getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AppUserDetails user) {
            return user;
        }
        return null;
    }

    public boolean isCourseMember(Long courseId) {
        AppUserDetails user = getCurrentUser();
        if (user == null) return false;
        boolean isMember = courseMemberRepo.existsByCourseIdAndUserId(courseId, user.getId());

        if (!isMember) {
            logger.info("User {} is not a member of course {}", user.getId(), courseId);
        }

        return isMember;
    }

    public boolean isCourseMember(Long courseId, Long userId) {
        boolean isMember = courseMemberRepo.existsByCourseIdAndUserId(courseId, userId);

        if (!isMember) {
            logger.info("Target User {} is not a member of course {}", userId, courseId);
        }

        return isMember;
    }

    public boolean isCourseStaff(Long courseId) {
        AppUserDetails user = getCurrentUser();
        if (user == null) return false;
        boolean isStaff = courseMemberRepo.existsByCourseIdAndUserIdAndRoleInClassIn(
                courseId, user.getId(), List.of(RoleInClass.TEACHER, RoleInClass.ASSISTANT)
        );

        if (!isStaff) {
            logger.info("User {} is not a staff member of course {}", user.getId(), courseId);
        }

        return isStaff;
    }

    public boolean isCourseStaff(Long courseId, Long userId) {
        boolean isStaff = courseMemberRepo.existsByCourseIdAndUserIdAndRoleInClassIn(
                courseId, userId, List.of(RoleInClass.TEACHER, RoleInClass.ASSISTANT)
        );

        if (!isStaff) {
            logger.info("Target User {} is not a staff member of course {}", userId, courseId);
        }

        return isStaff;
    }

    public boolean isAvailableModifyTeacher(Long courseId) {
        long teacherCount = courseMemberRepo.countByCourseIdAndRoleInClass(
                courseId, RoleInClass.TEACHER
        );

        if (teacherCount <= 1) {
            logger.info("User {} is not available to delete teacher of course {}", getCurrentUser().getId(), courseId);
            return false;
        }

        return true;
    }
}
