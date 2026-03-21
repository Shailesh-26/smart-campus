package com.example.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Room number cannot be empty")
    @Size(min = 2, max = 20, message = "Room number must be between 2 and 20 characters")
    @Column(nullable = false, unique = true)
    private String roomNumber;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Column(nullable = false)
    private Integer capacity;

    // ✅ MAINTENANCE FLAG — defaults to false
    @Column(nullable = false)
    private boolean underMaintenance = false;

    public Room() {}

    public Room(String roomNumber, Integer capacity) {
        this.roomNumber = roomNumber;
        this.capacity   = capacity;
    }

    public Long getId()                    { return id; }

    public String getRoomNumber()          { return roomNumber; }
    public void setRoomNumber(String r)    { this.roomNumber = r; }

    public Integer getCapacity()           { return capacity; }
    public void setCapacity(Integer c)     { this.capacity = c; }
    public void setCapacity(int c)         { this.capacity = c; }

    public boolean isUnderMaintenance()             { return underMaintenance; }
    public void setUnderMaintenance(boolean b)      { this.underMaintenance = b; }
}