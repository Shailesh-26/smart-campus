package com.example.demo.service;

import com.example.demo.model.Booking;
import com.example.demo.model.BookingStatus;
import com.example.demo.model.Room;
import com.example.demo.model.User;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    public BookingService(
            BookingRepository bookingRepository,
            RoomRepository roomRepository,
            UserRepository userRepository,
            EmailService emailService
    ) {
        this.bookingRepository = bookingRepository;
        this.roomRepository    = roomRepository;
        this.userRepository    = userRepository;
        this.emailService      = emailService;
    }

    // ✅ CREATE BOOKING — always PENDING
    public Booking createBooking(Long roomId, Booking booking, String email) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (hasConflict(roomId, booking.getStartTime(), booking.getEndTime())) {
            throw new RuntimeException("Booking conflict");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        booking.setRoom(room);
        booking.setBookedBy(user);
        booking.setStatus(BookingStatus.PENDING);

        return bookingRepository.save(booking);
    }

    // ✅ ADMIN: ALL BOOKINGS (kept for calendar / analytics — no regression)
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // ✅ ADMIN: PAGED BOOKINGS — new method
    public Page<Booking> getAllBookingsPaged(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String query
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        // If a search query is present, use the search method
        if (query != null && !query.trim().isEmpty()) {
            return bookingRepository.searchPaged(query.trim(), pageable);
        }

        return bookingRepository.findAll(pageable);
    }

    // ✅ USER: MY BOOKINGS
    public List<Booking> getBookingsByEmail(String email) {
        return bookingRepository.findByBookedByEmail(email);
    }

    // ✅ ROOM BOOKINGS
    public List<Booking> getBookingsByRoom(Long roomId) {
        return bookingRepository.findByRoomId(roomId);
    }

    // ✅ CONFLICT CHECK — only APPROVED bookings block
    private boolean hasConflict(Long roomId, LocalDateTime start, LocalDateTime end) {
        return bookingRepository.existsConflictingBooking(roomId, start, end);
    }

    // ✅ APPROVE BOOKING
    public Booking approveBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only PENDING bookings can be approved");
        }

        boolean conflict = bookingRepository.existsConflictingBooking(
                booking.getRoom().getId(),
                booking.getStartTime(),
                booking.getEndTime()
        );

        if (conflict) {
            throw new RuntimeException(
                "Cannot approve — another booking is already approved for this slot"
            );
        }

        booking.setStatus(BookingStatus.APPROVED);
        Booking saved = bookingRepository.save(booking);

        // ✅ SEND APPROVAL EMAIL
        try {
            emailService.sendBookingApproved(
                booking.getBookedBy().getEmail(),
                booking.getRoom().getRoomNumber(),
                booking.getStartTime().format(FORMATTER),
                booking.getEndTime().format(FORMATTER)
            );
        } catch (Exception e) {
            System.err.println(">>> EMAIL FAILED: " + e.getMessage());
            e.printStackTrace();
        }

        return saved;
    }

    // ✅ REJECT BOOKING
    public Booking rejectBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only PENDING bookings can be rejected");
        }

        booking.setStatus(BookingStatus.REJECTED);
        Booking saved = bookingRepository.save(booking);

        // ✅ SEND REJECTION EMAIL
        try {
            emailService.sendBookingRejected(
                booking.getBookedBy().getEmail(),
                booking.getRoom().getRoomNumber(),
                booking.getStartTime().format(FORMATTER),
                booking.getEndTime().format(FORMATTER)
            );
        } catch (Exception e) {
            System.err.println("Email send failed: " + e.getMessage());
        }

        return saved;
    }

    // ✅ CANCEL BOOKING
    public void cancelBooking(Long bookingId, String email, String role) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        boolean isOwner = booking.getBookedBy().getEmail().equals(email);

        if (!isOwner && !role.equals("ADMIN")) {
            throw new RuntimeException("Not allowed");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    public List<Booking> getUpcomingBookings() {
        LocalDateTime now      = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);
        return bookingRepository.findByStartTimeBetween(now, tomorrow);
    }

    public String getMostBookedRoom() {
        return bookingRepository.findMostBookedRoom();
    }
}