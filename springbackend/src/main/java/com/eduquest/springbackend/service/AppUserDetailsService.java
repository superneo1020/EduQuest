package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.UserAuthDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    public AppUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserAuthDto userInfo = userRepository.findAuthInfoByUsername(username).orElseThrow(() -> {
            logger.warn("Invalid username");
            return new UsernameNotFoundException("User not found");
        });
        logger.info("Loading UserDetails for {}", username);
        Collection<String> roles = userRepository.findRoleNamesByUsername(username);
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        roles.forEach(role -> authorities.add(new SimpleGrantedAuthority(role)));
        return new AppUserDetails(userInfo.id(), userInfo.username(), userInfo.password(), authorities);
    }
}