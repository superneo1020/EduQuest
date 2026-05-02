package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.ItemRepository;
import com.eduquest.springbackend.dao.UserItemRepository;
import com.eduquest.springbackend.dao.UserRepository;
import com.eduquest.springbackend.dto.UserItemDto;
import com.eduquest.springbackend.dto.UserItemRequest;
import com.eduquest.springbackend.dto.UserItemResponse;
import com.eduquest.springbackend.dto.UtilDetailedListResponse;
import com.eduquest.springbackend.exception.InsufficientPointsException;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.model.Item;
import com.eduquest.springbackend.model.UserItem;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserItemService {

    private final UserItemRepository userItemRepo;
    private final UserRepository userRepo;
    private final ItemRepository itemRepo;

    private final ItemService itemService;
    private final DtoMapper dtoMapper;

    public UserItemService(UserItemRepository userItemRepo,
                           UserRepository userRepo,
                           ItemRepository itemRepo,
                           ItemService itemService, DtoMapper dtoMapper) {
        this.userItemRepo = userItemRepo;
        this.userRepo = userRepo;
        this.itemRepo = itemRepo;
        this.itemService = itemService;
        this.dtoMapper = dtoMapper;
    }

    @Transactional
    public UserItemResponse createUserItem(Long userId, UserItemRequest req) {

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
    public UtilDetailedListResponse<UserItemDto> showItem(Long userId) {
        return dtoMapper.toDetailedListResponse(userItemRepo.findAllByUserId(userId));
    }

    @Transactional(readOnly = true)
    public UtilDetailedListResponse<UserItemDto> showItemByType(Long userId, String type) {
        return dtoMapper.toDetailedListResponse(userItemRepo.findAllByUserIdAndItemType(userId, type));
    }

    @Transactional(readOnly = true)
    public Boolean checkUserItemAndItemExists(Long userId, Long itemId, String itemType) {
        return checkUserItemExists(userId, itemId) && checkItemExists(itemId, itemType);
    }

    @Transactional(readOnly = true)
    public Boolean checkUserItemExists(Long userId, Long itemId) {
        return userItemRepo.existsByUserIdAndItemId(userId, itemId);
    }

    @Transactional(readOnly = true)
    public Boolean checkItemExists(Long itemId, String itemType) {
        return itemRepo.existsByIdAndType(itemId, itemType);
    }
}
