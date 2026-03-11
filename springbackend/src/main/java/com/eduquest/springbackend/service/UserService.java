package com.eduquest.springbackend.service;

import com.eduquest.springbackend.Util.PageableUtils;
import com.eduquest.springbackend.dao.*;
import com.eduquest.springbackend.dto.UserGameScoreDto;
import com.eduquest.springbackend.dto.UserMissionDto;
import com.eduquest.springbackend.dto.UserProfileDto;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
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
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final UserDtoMapper userDtoMapper;
    private final UserGameScoreRepository userGameRepo;
    private final GameRepository gameRepo;
    private final UserMissionRepository userMissionRepo;

    private final Set<String> USER_PROFILE_DTO_FIELD = Set.of(
            "gameName", "gameType", "gameDifficulty", "gameIcon", "gameDescription", "scores", "createdAt"
    );

    public UserService(UserRepository userRepo,
                       RoleRepository roleRepo,
                       UserDtoMapper userDtoMapper,
                       UserGameScoreRepository userGameRepo,
                       GameRepository gameRepo,
                       UserMissionRepository userMissionRepo) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.userDtoMapper = userDtoMapper;
        this.userGameRepo = userGameRepo;
        this.gameRepo = gameRepo;
        this.userMissionRepo = userMissionRepo;
    }

    @Transactional
    public AppUser saveUser(AppUser user) {
        return userRepo.save(user);
    }

    @Transactional
    public Role saveRole(Role role) {
        return roleRepo.save(role);
    }

    @Transactional(readOnly = true)
    public AppUser findUserByUsername(String username) {
        return userRepo.findByUsername(username).orElse(null);
    }

    @Transactional(readOnly = true)
    public Role findRoleByName(String name) {
        return roleRepo.findByName(name).orElse(null);
    }

    @Transactional
    public void addRoleToUser(String user_name, String role_name) {
        AppUser user = userRepo.findByUsername(user_name).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found：　" + user_name));
        Role role = roleRepo.findByName(role_name).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found:　" + role_name));
        user.getRoles().add(role);
    }

    @Transactional(readOnly = true)
    public UserProfileDto showProfile(UserDetails userDetails, Pageable pageable) {
        Long id = userRepo.findIdByUsername(userDetails.getUsername()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Pageable cleanPageable = PageableUtils.filterSort(pageable, USER_PROFILE_DTO_FIELD);

        var page = userGameRepo.findUserGameScoresByUserId(id, cleanPageable);

        return userDtoMapper.toProfile(page);
    }

    @Transactional(readOnly = true)
    public UserProfileDto showProfile(UserDetails userDetails, Pageable pageable, String gameName) {
        Long userId = userRepo.findIdByUsername(userDetails.getUsername()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Long gameId = gameRepo.findIdByName(gameName).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));

        Pageable cleanPageable = PageableUtils.filterSort(pageable, USER_PROFILE_DTO_FIELD);

        var page = userGameRepo.findUserGameScoresByUserIdAndGameId(userId, gameId, cleanPageable);

        return userDtoMapper.toProfile(page);
    }

    @Transactional(readOnly = true)
    public List<UserGameScoreDto> showBestGameRecord(UserDetails userDetails) {
        Long id = userRepo.findIdByUsername(userDetails.getUsername()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return userGameRepo.findAllHighestScoresByUserId(id);
    }

    @Transactional(readOnly = true)
    public UserGameScoreDto showBestGameRecord(UserDetails userDetails, String gameName) {
        Long userId = userRepo.findIdByUsername(userDetails.getUsername()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Long gameId = gameRepo.findIdByName(gameName).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));

        return userGameRepo.findHighestScoresByUserIdAndGameId(userId, gameId);
    }

    @Transactional(readOnly = true)
    public List<UserMissionDto> showMission(UserDetails userDetails, Boolean completed) {
        Long id = userRepo.findIdByUsername(userDetails.getUsername()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return userMissionRepo.findAllByUserIdAndCompleted(id, completed);
    }
}
