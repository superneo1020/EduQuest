package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User register(User user) {
        userRepository.save(user);
        return user;
    }

    @Transactional
    public boolean login(String username, String password) {
        User user = userRepository.findByUsernameAndPassword(username, password);
        return user != null && user.getUsername().equals(username) && user.getPassword().equals(password);
    }
}
