package com.example.demo.controller;

import com.example.demo.model.Room;
import com.example.demo.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    // ✅ GET ALL ROOMS — any authenticated user
    @GetMapping
    public ResponseEntity<List<Room>> getAll() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    // ✅ GET ROOM BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Room> getById(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    // ✅ CREATE ROOM — admin only
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Room> create(@Valid @RequestBody Room room) {
        return ResponseEntity.ok(roomService.saveRoom(room));
    }

    // ✅ UPDATE ROOM — admin only
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Room> update(
            @PathVariable Long id,
            @Valid @RequestBody Room room
    ) {
        return ResponseEntity.ok(roomService.updateRoom(id, room));
    }

    // ✅ DELETE ROOM — admin only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ TOGGLE MAINTENANCE — admin only
    @PutMapping("/{id}/maintenance")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Room> toggleMaintenance(
            @PathVariable Long id,
            @RequestParam boolean block
    ) {
        return ResponseEntity.ok(roomService.toggleMaintenance(id, block));
    }
}