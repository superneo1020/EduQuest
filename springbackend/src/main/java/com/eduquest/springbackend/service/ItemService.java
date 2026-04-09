package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.ItemRepository;
import com.eduquest.springbackend.dto.ItemDto;
import com.eduquest.springbackend.dto.ItemShopRequest;
import com.eduquest.springbackend.dto.UtilPageResponse;
import com.eduquest.springbackend.model.Item;
import com.eduquest.springbackend.util.PageableUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserService userService;
    private final DtoMapper dtoMapper;

    private final Set<String> ITEM_DTO_FIELDS = Set.of(
            "id", "type", "name", "description", "icon", "price"
    );

    public ItemService(ItemRepository itemRepository, UserService userService, DtoMapper dtoMapper) {
        this.itemRepository = itemRepository;
        this.userService = userService;
        this.dtoMapper = dtoMapper;
    }

    @Transactional(readOnly = true)
    public Long checkIdByName(String name) {
        return itemRepository.findIdByName(name).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
    }

    @Transactional(readOnly = true)
    public UtilPageResponse<ItemDto> findItemByFilter(ItemShopRequest req, String username, Pageable pageable) {
        Pageable cleanPageable = PageableUtils.filterSort(pageable, ITEM_DTO_FIELDS);
        List<Specification<Item>> specs = new ArrayList<>();

        // 1. Add Type filter
        if (req.type() != null) {
            specs.add((root, query, cb) -> cb.equal(root.get("type"), req.type()));
        }

        // 2. Add Name filter
        if (req.name() != null && !req.name().isBlank()) {
            String pattern = "%" + req.name().trim() + "%";
            specs.add((root, query, cb) -> cb.like(cb.lower(root.get("name")), pattern));
        }

        // 3. Add User Points filter
        if (Boolean.TRUE.equals(req.filterWithUserPoints())) {
            int points = userService.findPointsByUsername(username);
            specs.add((root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), points));
        }

        // 4. Combine all using the new 'allOf' method
        // If the list is empty, it effectively returns 'findAll()'
        var items = itemRepository.findAll(Specification.allOf(specs), cleanPageable);

        Page<ItemDto> dtoPage = items.map(item -> new ItemDto(
                item.getId(),
                item.getType(),
                item.getName(),
                item.getDescription(),
                item.getIcon(),
                item.getPrice()
        ));

        return dtoMapper.toPageResponse(dtoPage);
    }

    @Transactional
    public Item save(Item item) {
        return itemRepository.save(item);
    }

    @Transactional
    public void delete(Long id) {
        itemRepository.deleteById(id);
    }

    @Transactional
    public Item update(Item item) {
        return itemRepository.save(item);
    }
}
