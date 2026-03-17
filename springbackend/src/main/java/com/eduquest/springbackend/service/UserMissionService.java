package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.UserMissionRepository;
import com.eduquest.springbackend.dto.UserMissionDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserMissionService {

    private final UserMissionRepository userMissionRepo;

    public UserMissionService(UserMissionRepository userMissionRepo) {
        this.userMissionRepo = userMissionRepo;
    }

    @Transactional(readOnly = true)
    public List<UserMissionDto> showMission(String username, Boolean completed) {
        return userMissionRepo.findAllByUsernameAndCompleted(username, completed);
    }
}
