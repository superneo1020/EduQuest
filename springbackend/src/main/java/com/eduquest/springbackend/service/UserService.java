package com.eduquest.springbackend.service;

import com.eduquest.springbackend.Util.PageableUtils;
import com.eduquest.springbackend.dao.GameRepository;
import com.eduquest.springbackend.dao.RoleRepository;
import com.eduquest.springbackend.dao.UserGameScoreRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.UserGameScoreDto;
import com.eduquest.springbackend.dto.UserProfileDto;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserDtoMapper userDtoMapper;
    private final UserGameScoreRepository userGameScoreRepository;
    private final GameRepository gameRepository;

    private final Set<String> USER_PROFILE_DTO_FIELD = Set.of(
            "gameName", "gameType", "gameDifficulty", "gameIcon", "gameDescription", "scores", "createdAt"
    );

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       UserDtoMapper userDtoMapper,
                       UserGameScoreRepository userGameScoreRepository,
                       GameRepository gameRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userDtoMapper = userDtoMapper;
        this.userGameScoreRepository = userGameScoreRepository;
        this.gameRepository = gameRepository;
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
    public UserProfileDto showProfile(UserDetails userDetails, Pageable pageable) {
        Long id = userRepository.findIdByUsername(userDetails.getUsername()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Pageable cleanPageable = PageableUtils.filterSort(pageable, USER_PROFILE_DTO_FIELD);

        Page<UserGameScoreDto> page = userGameScoreRepository.findUserGameScoresByUserId(id, cleanPageable);

        return userDtoMapper.toProfile(page);
    }

    @Transactional(readOnly = true)
    public UserProfileDto showProfile(UserDetails userDetails, Pageable pageable, String gameName) {
        Long userId = userRepository.findIdByUsername(userDetails.getUsername()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Long gameId = gameRepository.findIdByName(gameName).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));

        Pageable cleanPageable = PageableUtils.filterSort(pageable, USER_PROFILE_DTO_FIELD);

        Page<UserGameScoreDto> page = userGameScoreRepository.findUserGameScoresByUserIdAndGameId(userId, gameId, cleanPageable);

        return userDtoMapper.toProfile(page);
    }

    @Transactional(readOnly = true)
    public List<UserGameScoreDto> showBestGameRecord(UserDetails userDetails) {
        Long id = userRepository.findIdByUsername(userDetails.getUsername()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return userGameScoreRepository.findAllHighestScoresByUserId(id);
    }

    @Transactional(readOnly = true)
    public UserGameScoreDto showBestGameRecord(UserDetails userDetails, String gameName) {
        Long userId = userRepository.findIdByUsername(userDetails.getUsername()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Long gameId = gameRepository.findIdByName(gameName).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));

        return userGameScoreRepository.findHighestScoresByUserIdAndGameId(userId, gameId);
    }
}
