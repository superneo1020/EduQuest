package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.RoleRepository;
import com.eduquest.springbackend.dao.UserGameScoreRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.UserProfileDto;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
import com.eduquest.springbackend.model.UserGameScore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserDtoMapper userDtoMapper;
    private final UserGameScoreRepository userGameScoreRepository;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       UserDtoMapper userDtoMapper,
                       UserGameScoreRepository userGameScoreRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userDtoMapper = userDtoMapper;
        this.userGameScoreRepository = userGameScoreRepository;
    }

    @Transactional
    public AppUser saveUser(AppUser user) {
        return userRepository.save(user);
    }

    @Transactional
    public Role saveRole(Role role) {
        return roleRepository.save(role);
    }

    @Transactional(readOnly = true)
    public AppUser findUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    @Transactional(readOnly = true)
    public Role findRoleByName(String name) {
        return roleRepository.findByName(name).orElse(null);
    }

    @Transactional
    public void addRoleToUser(String user_name, String role_name) {
        AppUser user = userRepository.findByUsername(user_name).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found：　" + user_name));
        Role role = roleRepository.findByName(role_name).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found:　" + role_name));
        user.getRoles().add(role);
    }

    @Transactional(readOnly = true)
    public UserProfileDto showProfile(UserDetails userDetails, int currentPage) {
        AppUser user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        final int pageSize = 10;
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");

        Page<UserGameScore> page = userGameScoreRepository.findByUserIdOrderByCreatedAtDesc(
                user.getId(),
                PageRequest.of(Math.max(0, currentPage), pageSize, sort)
        );

        if (page.getTotalPages() > 0 && currentPage >= page.getTotalPages()) {
            int lastPageIndex = page.getTotalPages() - 1;
            page = userGameScoreRepository.findByUserIdOrderByCreatedAtDesc(
                    user.getId(),
                    PageRequest.of(lastPageIndex, pageSize, sort)
            );
        }

        return userDtoMapper.toProfile(user, page);
    }
}
