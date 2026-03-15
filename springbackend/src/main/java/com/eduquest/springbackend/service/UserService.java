package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.RoleRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;

    public UserService(UserRepository userRepo, RoleRepository roleRepo) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
    }

    @Transactional(readOnly = true)
    public Long checkIdByUsername(String username) {
        return userRepo.findIdByUsername(username).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + username));
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
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + user_name));
        Role role = roleRepo.findByName(role_name).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + role_name));
        user.getRoles().add(role);
    }

    @Transactional(readOnly = true)
    public Integer findPointsByUsername(String username) {
        return userRepo.findPointsByUsername(username).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found：　" + username));
    }
}
