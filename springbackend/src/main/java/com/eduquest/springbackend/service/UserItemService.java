package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.ItemRepository;
import com.eduquest.springbackend.dao.UserItemRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.UserItemDto;
import com.eduquest.springbackend.dto.UserItemRequest;
import com.eduquest.springbackend.dto.UserItemResponse;
import com.eduquest.springbackend.exception.InsufficientPointsException;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Item;
import com.eduquest.springbackend.model.UserItem;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserItemService {

    private final UserItemRepository userItemRepo;
    private final UserRepository userRepo;
    private final ItemRepository itemRepo;
    private final UserService userService;
    private final ItemService itemService;

    public UserItemService(UserItemRepository userItemRepo,
                           UserRepository userRepo,
                           ItemRepository itemRepo,
                           UserService userService,
                           ItemService itemService) {
        this.userItemRepo = userItemRepo;
        this.userRepo = userRepo;
        this.itemRepo = itemRepo;
        this.userService = userService;
        this.itemService = itemService;
    }

    @Transactional
    public UserItemResponse createUserItem(String username, UserItemRequest req) {

        Long userId = userService.checkIdByUsername(username);
        Long itemId = itemService.checkIdByName(req.itemName());

        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Item item = itemRepo.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        // Check if user has enough points
        if (user.getPoints() < item.getPrice()) {
            throw new InsufficientPointsException(
                String.format("Insufficient points: current=%d, required=%d", 
                    user.getPoints(), item.getPrice())
            );
        }

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

    @Transactional(readOnly = true)
    public Boolean checkUserItemAndItemExists(String username, Long itemId, String itemType) {
        return checkUserItemExists(username, itemId) && checkItemExists(itemId, itemType);
    }

    @Transactional(readOnly = true)
    public Boolean checkUserItemExists(String username, Long itemId) {
        return userItemRepo.existsByUserIdAndItemId(
                userService.checkIdByUsername(username),
                itemId
        );
    }

    @Transactional(readOnly = true)
    public Boolean checkItemExists(Long itemId, String itemType) {
        return itemRepo.existsByIdAndType(itemId, itemType);
    }
}
