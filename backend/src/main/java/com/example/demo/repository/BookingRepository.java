package com.example.demo.repository;

import com.example.demo.model.Booking;
import com.example.demo.model.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByRoomId(Long roomId);
    List<Booking> findByBookedByEmail(String email);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByBookedByEmailAndStatus(String email, BookingStatus status);
    List<Booking> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    // ✅ NEW — used by ReminderService
    List<Booking> findByStatusAndStartTimeBetween(
            BookingStatus status,
            LocalDateTime start,
            LocalDateTime end
    );

    // ✅ PAGED — used by AdminBookings
    Page<Booking> findAll(Pageable pageable);

    @Query("""
        SELECT b FROM Booking b
        WHERE LOWER(b.room.roomNumber) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(b.bookedBy.email) LIKE LOWER(CONCAT('%', :query, '%'))
    """)
    Page<Booking> searchPaged(String query, Pageable pageable);

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.room.id = :roomId
        AND b.status = com.example.demo.model.BookingStatus.APPROVED
        AND b.startTime < :endTime
        AND b.endTime > :startTime
    """)
    boolean existsConflictingBooking(
            Long roomId,
            LocalDateTime startTime,
            LocalDateTime endTime
    );

    @Query("""
        SELECT b.room.roomNumber
        FROM Booking b
        WHERE b.status = com.example.demo.model.BookingStatus.APPROVED
        GROUP BY b.room.roomNumber
        ORDER BY COUNT(b.id) DESC
        LIMIT 1
    """)
    String findMostBookedRoom();
}