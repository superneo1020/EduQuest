package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.RoleRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.model.Role;
import com.eduquest.springbackend.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;

@Service
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username);
        if (user == null) throw new UsernameNotFoundException("User not found");
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        user.getRoles().forEach(role -> authorities.add(new SimpleGrantedAuthority(role.getName())));
        return new org.springframework.security.core.userdetails.User(user.getUsername(), user.getPassword(), authorities);
    }

    @Transactional
    public User saveUser (User user) {
        return userRepository.save(user);
    }

    @Transactional
    public Role saveRole (Role role) {
        return roleRepository.save(role);
    }

    @Transactional
    public User findUserByUsername (String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional
    public Role findRoleByName (String name) {
        return roleRepository.findByName(name);
    }

    @Transactional
    public void addRoleToUser (String user_name, String role_name) {
        User user = userRepository.findByUsername(user_name);
        Role role = roleRepository.findByName(role_name);
        user.getRoles().add(role);
    }
}
