package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.ItemRepository;
import com.eduquest.springbackend.dao.UserItemRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.UserItemDto;
import com.eduquest.springbackend.dto.UserItemRequest;
import com.eduquest.springbackend.dto.UserItemResponse;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Item;
import com.eduquest.springbackend.model.UserItem;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UserItemService {

    private final UserItemRepository userItemRepo;
    private final UserRepository userRepo;
    private final ItemRepository itemRepo;

    public UserItemService(UserItemRepository userItemRepo,
                           UserRepository userRepo,
                           ItemRepository itemRepo
    ) {
        this.userItemRepo = userItemRepo;
        this.userRepo = userRepo;
        this.itemRepo = itemRepo;
    }

    @Transactional
    public UserItemResponse createUserItem(String username, UserItemRequest req) {

        AppUser user = userRepo.getReferenceByUsername(username).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + username));
        Item item = itemRepo.getReferenceByName(req.itemName()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found: " + req.itemName()));

        UserItem userItem = new UserItem(user, item);
        UserItem savedUserItem = userItemRepo.save(userItem);

        return new UserItemResponse(
                savedUserItem.getId(),
                savedUserItem.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<UserItemDto> showItem(String username) {
        return userItemRepo.findAllByUsername(username);
    }
}
