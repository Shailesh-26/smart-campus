package com.example.demo.service;

import com.example.demo.model.Room;
import com.example.demo.repository.RoomRepository;
import com.example.demo.exception.RoomNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room saveRoom(Room room) {
        return roomRepository.save(room);
    }

    public Room getRoomById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new RoomNotFoundException(id));
    }

    public Room updateRoom(Long id, Room updatedRoom) {
        Room existing = getRoomById(id);
        existing.setRoomNumber(updatedRoom.getRoomNumber());
        existing.setCapacity(updatedRoom.getCapacity());
        return roomRepository.save(existing);
    }

    public void deleteRoom(Long id) {
        roomRepository.delete(getRoomById(id));
    }

    // ✅ TOGGLE MAINTENANCE
    public Room toggleMaintenance(Long id, boolean block) {
        Room room = getRoomById(id);
        room.setUnderMaintenance(block);
        return roomRepository.save(room);
    }
}