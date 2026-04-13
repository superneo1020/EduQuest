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
            logger.info("Access Denied: User {} is not a member of course {}", user.getId(), courseId);
        }

        return isMember;
    }

    public boolean isCourseMember(Long courseId, Long userId) {
        boolean isMember = courseMemberRepo.existsByCourseIdAndUserId(courseId, userId);

        if (!isMember) {
            logger.info("Access Denied: Target User {} is not a member of course {}", userId, courseId);
        }

        return isMember;
    }

    public boolean isCourseStaff(Long courseId) {
        AppUserDetails user = getCurrentUser();
        if (user == null) return false;
        boolean isStaff = courseMemberRepo.existsByCourseIdAndUserIdAndRoleInClassIn(
                courseId, user.getId(), List.of(RoleInClass.TEACHER, RoleInClass.ASSISTANT, RoleInClass.HEAD_TEACHER)
        );

        if (!isStaff) {
            logger.info("Access Denied: User {} is not a staff member of course {}", user.getId(), courseId);
        }

        return isStaff;
    }

    public boolean isCourseStaff(Long courseId, Long userId) {
        boolean isStaff = courseMemberRepo.existsByCourseIdAndUserIdAndRoleInClassIn(
                courseId, userId, List.of(RoleInClass.TEACHER, RoleInClass.ASSISTANT, RoleInClass.HEAD_TEACHER)
        );

        if (!isStaff) {
            logger.info("Access Denied: Target User {} is not a staff member of course {}", userId, courseId);
        }

        return isStaff;
    }

    public boolean canDeleteMember(Long courseId, Long targetUserId) {
        AppUserDetails currentUser = getCurrentUser();
        if (currentUser == null) return false;

        // 1. Am I the Head Teacher?
        boolean isSelfHead = courseMemberRepo.existsByCourseIdAndUserIdAndRoleInClass(
                courseId, currentUser.getId(), RoleInClass.HEAD_TEACHER
        );

        // 2. Is the target a Head Teacher? (Prevents Head Teachers from deleting each other)
        boolean isTargetHead = courseMemberRepo.existsByCourseIdAndUserIdAndRoleInClass(
                courseId, targetUserId, RoleInClass.HEAD_TEACHER
        );

        // 3. Optional: Is the target actually myself?
        boolean isSelfTarget = currentUser.getId().equals(targetUserId);

        if (!isSelfHead) {
            logger.info("Access Denied: User {} is not Head Teacher of course {}", currentUser.getId(), courseId);
            return false;
        }

        if (isTargetHead && !isSelfTarget) {
            logger.info("Access Denied: Head Teacher {} cannot delete another Head Teacher {}", currentUser.getId(), targetUserId);
            return false;
        }

        // Success: I am Head Teacher AND target is not a Head Teacher (or is me)
        return true;
    }

    public boolean canDeleteClass(Long courseId) {
        AppUserDetails currentUser = getCurrentUser();
        if (currentUser == null) return false;

        // Am I the Head Teacher?
        boolean isSelfHead = courseMemberRepo.existsByCourseIdAndUserIdAndRoleInClass(
                courseId, currentUser.getId(), RoleInClass.HEAD_TEACHER
        );

        if (!isSelfHead) {
            logger.info("Access Denied: Current User {} is not Head Teacher of course {}", currentUser.getId(), courseId);
            return false;
        }

        // Success: I am Head Teacher
        return true;
    }

    public boolean canChangeRoles(Long courseId, RoleInClass targetRole) {
        AppUserDetails user = getCurrentUser();
        if (user == null) return false;

        // Only if someone tries to appoint a NEW Head Teacher
        if (targetRole == RoleInClass.HEAD_TEACHER) {
            boolean isSelfHead = courseMemberRepo.existsByCourseIdAndUserIdAndRoleInClass(
                    courseId, user.getId(), RoleInClass.HEAD_TEACHER
            );

            if (!isSelfHead) {
                logger.warn("Access Denied: Educator {} tried to appoint a HEAD_TEACHER but is not one themselves.", user.getId());
                return false;
            }
        }

        // For all other role changes (Teacher, Assistant, Student),
        // we trust the Educator role and allow the change.
        return true;
    }
}
