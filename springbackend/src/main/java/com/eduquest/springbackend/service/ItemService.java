package com.eduquest.springbackend.service;

import com.eduquest.springbackend.dao.ItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ItemService {

    private final ItemRepository itemRepository;

    public ItemService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @Transactional(readOnly = true)
    public Long checkIdByName(String name) {
        return itemRepository.findIdByName(name).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));
    }
}
