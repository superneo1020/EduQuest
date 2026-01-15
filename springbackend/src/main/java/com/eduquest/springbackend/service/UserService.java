package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.RoleRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional
    public AppUser saveUser (AppUser user) {
        return userRepository.save(user);
    }

    @Transactional
    public Role saveRole (Role role) {
        return roleRepository.save(role);
    }

    @Transactional
    public AppUser findUserByUsername (String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional
    public Role findRoleByName (String name) {
        return roleRepository.findByName(name);
    }

    @Transactional
    public void addRoleToUser (String user_name, String role_name) {
        AppUser user = userRepository.findByUsername(user_name);
        Role role = roleRepository.findByName(role_name);
        user.getRoles().add(role);
    }
}
