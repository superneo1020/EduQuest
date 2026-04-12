package com.eduquest.springbackend.service.security;

import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.service.AppUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("userSecurity")
public class UserSecurity {

    private final Logger logger = LoggerFactory.getLogger(this.getClass());
    private final UserRepository userRepo;

    public UserSecurity(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    public AppUserDetails getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AppUserDetails user) {
            return user;
        }
        return null;
    }

    public boolean isSameUser(Long targetUserId) {
        AppUserDetails user = getCurrentUser();
        if (user == null) return false;

        boolean isSame = user.getId().equals(targetUserId);
        if (!isSame) {
            logger.info("User {} is not the target user {} itself", user.getId(), targetUserId);
        }

        return isSame;
    }

    public boolean isSameSchool(Long targetUserId) {
        AppUserDetails user = getCurrentUser();
        if (user == null) return false;

        Long schoolId = userRepo.findSchoolIdById(user.getId()).orElse(null);
        if (schoolId == null) {
            logger.info("User {} has no school", user.getId());
            return false;
        }

        boolean isSame = userRepo.existsByIdAndSchoolId(targetUserId, schoolId);

        if (!isSame) {
            logger.info("User {} is not in the same school as user {}", user.getId(), targetUserId);
        }

        return isSame;
    }
}
