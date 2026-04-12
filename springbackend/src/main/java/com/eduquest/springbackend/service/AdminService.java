package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.RoleRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.AdminFilterForUserRequest;
import com.eduquest.springbackend.dto.AdminFilterForUserResponse;
import com.eduquest.springbackend.dto.OperationResult;
import com.eduquest.springbackend.dto.UtilPageResponse;
import com.eduquest.springbackend.enums.EducatorStatus;
import com.eduquest.springbackend.exception.RuleViolationException;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
import com.eduquest.springbackend.model.School;
import com.eduquest.springbackend.util.PageableUtils;
import jakarta.persistence.criteria.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@PreAuthorize("hasRole('ADMIN')")
public class AdminService {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;

    private final DtoMapper dtoMapper;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    private final Set<String> USER_FILTER_REQUEST_DTO_FIELDS = Set.of(
            "username", "email", "schoolName", "educatorStatus"
    );

    public AdminService(UserRepository userRepo,
                        RoleRepository roleRepo,
                        DtoMapper dtoMapper) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.dtoMapper = dtoMapper;
    }

    @Transactional(readOnly = true)
    public UtilPageResponse<AdminFilterForUserResponse> findAllUserByFilter(AdminFilterForUserRequest req, Pageable pageable) {
        // 1. Sanitize the pageable to prevent malicious sorting
        Pageable cleanPageable = PageableUtils.filterSort(pageable, USER_FILTER_REQUEST_DTO_FIELDS);

        // 2. Define the Specification using a single lambda (No 'where' needed)
        Specification<AppUser> spec = (root, query, cb) -> {
            // PERFORMANCE: Fetch school and roles to avoid N+1 issues
            // Only do this for the result query, not the count query (used by Pageable)
            if (query != null && !Long.class.equals(query.getResultType())) {
                root.fetch("school", JoinType.LEFT);
                query.distinct(true);
            }

            List<Predicate> predicates = new ArrayList<>();

            // --- Simple Fields ---
            if (req.isActive() != null) {
                predicates.add(cb.equal(root.get("isActive"), req.isActive()));
            }

            if (req.educatorStatus() != null) {
                predicates.add(cb.equal(root.get("educatorStatus"), req.educatorStatus()));
            }

            // --- Joined Fields (School) ---
            if (StringUtils.hasText(req.schoolName())) {
                Join<AppUser, School> schoolJoin = root.join("school", JoinType.LEFT);
                String pattern = "%" + req.schoolName().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(schoolJoin.get("name")), pattern));
            }

            // --- Joined Fields (Roles) ---
            if (req.roleId() != null) {
                Join<AppUser, Role> roleJoin = root.join("roles", JoinType.LEFT);
                predicates.add(cb.equal(roleJoin.get("id"), req.roleId()));
            }

            // --- String Searches (Username/Email) ---
            addStringSearch(predicates, cb, root.get("username"), req.username());
            addStringSearch(predicates, cb, root.get("email"), req.email());

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // 3. Execute and Map to DTO
        Page<AppUser> users = userRepo.findAll(spec, cleanPageable);

        return dtoMapper.toPageResponse(users.map(user -> {
            // Logic to determine the "Main" role status
            boolean isAdmin = user.getRoles().stream()
                    .anyMatch(r -> r.getName().equalsIgnoreCase("ROLE_ADMIN"));
            boolean isEducator = user.getRoles().stream()
                    .anyMatch(r -> r.getName().equalsIgnoreCase("ROLE_EDUCATOR"));

            return new AdminFilterForUserResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getSchool() != null ? user.getSchool().getId() : null,
                    user.getSchool() != null ? user.getSchool().getName() : "No School",
                    isAdmin,    // Send as a boolean only
                    isEducator, // Send as a boolean only
                    user.getActive(),
                    user.getEducatorStatus(),
                    user.getCreatedAt(),
                    user.getUpdatedAt()
            );
        }));
    }

    private void addStringSearch(List<Predicate> predicates, CriteriaBuilder cb, Expression<String> path, String value) {
        if (StringUtils.hasText(value)) {
            String pattern = "%" + value.trim().toLowerCase() + "%";
            predicates.add(cb.like(cb.lower(path), pattern));
        }
    }

    @Transactional
    public OperationResult activateUser(Long id) {
        AppUser user = userRepo.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));

        user.setActive(true);

        String message = "Educator activated successfully.";
        boolean warning = false;

        if (!EnumSet.of(EducatorStatus.NONE, EducatorStatus.ADMIN).contains(user.getEducatorStatus())) {
            user.setEducatorStatus(EducatorStatus.APPROVED);

            Role educatorRole = roleRepo.findByName("ROLE_EDUCATOR")
                    .orElseThrow(() -> new IllegalStateException("ROLE_EDUCATOR must be pre-configured"));
            if (!user.getRoles().contains(educatorRole)) {
                user.getRoles().add(educatorRole);
            } else {
                logger.warn("Educator role already exists");
                warning = true;
                message += " [Note] Educator role already exists";
            }
        }
        userRepo.save(user);
        return new OperationResult(message, warning);
    }

    @Transactional
    public OperationResult rejectEducator(Long id) {
        AppUser user = userRepo.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));

        String message = "Educator rejected successfully.";
        boolean warning = false;

        if (EnumSet.of(EducatorStatus.PENDING, EducatorStatus.APPROVED).contains(user.getEducatorStatus())) {
            user.setEducatorStatus(EducatorStatus.REJECTED);
            user.setActive(false);
            boolean roleRemoved = user.getRoles().removeIf(r -> r.getName().equals("ROLE_EDUCATOR"));
            // In production, we should invalidate the user's current JWT.
            // Since this is a demo without Redis, we rely on JWT expiration.
            if (!roleRemoved) {
                logger.warn("Educator rejected successfully but no educator role found");
                warning = true;
                message += " [Note] No educator role found";
            }
        } else {
            throw new RuleViolationException("User is not in a pending or approved state");
        }

        userRepo.save(user);
        return new OperationResult(message, warning);
    }
}
