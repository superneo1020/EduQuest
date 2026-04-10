package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.CourseMemberRepository;
import com.eduquest.springbackend.dao.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@PreAuthorize("hasRole('EDUCATOR')")
public class EducatorService {

    private final Set<String> USER_FILTER_REQUEST_DTO_FIELDS = Set.of(
            "username", "email"
    );
    private final UserRepository userRepo;
    private final CourseMemberRepository courseMemberRepo;

    private final UserService userService;

    public EducatorService(UserRepository userRepo, UserService userService, CourseMemberRepository courseMemberRepo) {
        this.userRepo = userRepo;
        this.userService = userService;
        this.courseMemberRepo = courseMemberRepo;
    }
}
