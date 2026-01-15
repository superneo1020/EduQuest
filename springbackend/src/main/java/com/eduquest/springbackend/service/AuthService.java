package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.model.AppUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    public AuthService(UserRepository userRepository,
                       AuthenticationManager authenticationManager,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AppUser register(AppUser user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Transactional
    public String login(String username, String password) {
        try {
            logger.info("Authenticating user: {}", username);
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
            if (authentication.isAuthenticated()) {
                logger.info("Authentication successful for user {}", username);
                return jwtService.generateToken(authentication);
            }
            logger.error("Authentication failed for user {}", username);
            throw new BadCredentialsException("Invalid username or password");
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid username or password", e);
        } catch (Exception e) {
            throw new RuntimeException("Authentication failed", e);
        }
    }

    @Transactional
    public String testEncoder(String rawPassword) {
        String encodedPassword = passwordEncoder.encode(rawPassword);
        return "Raw: " + rawPassword + "\nEncoded: " + encodedPassword +
                "\nMatches: " + passwordEncoder.matches(rawPassword, encodedPassword);
    }
}
