package com.example.demo.controller;

import com.example.demo.model.Booking;
import com.example.demo.service.BookingService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // ✅ CREATE BOOKING
    @PostMapping("/room/{roomId}")
    public ResponseEntity<Booking> create(
            @PathVariable Long roomId,
            @RequestBody Booking booking,
            Authentication auth
    ) {
        return ResponseEntity.ok(
            bookingService.createBooking(roomId, booking, auth.getName())
        );
    }

    // ✅ ALL BOOKINGS — admin only (kept for calendar/analytics)
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Booking>> getAll() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // ✅ PAGED BOOKINGS — admin only, new endpoint
    @GetMapping("/paged")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Page<Booking>> getPaged(
            @RequestParam(defaultValue = "0")  int    page,
            @RequestParam(defaultValue = "10") int    size,
            @RequestParam(defaultValue = "startTime") String sortBy,
            @RequestParam(defaultValue = "desc")      String sortDir,
            @RequestParam(defaultValue = "")          String query
    ) {
        return ResponseEntity.ok(
            bookingService.getAllBookingsPaged(page, size, sortBy, sortDir, query)
        );
    }

    // ✅ MY BOOKINGS
    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMy(Authentication auth) {
        return ResponseEntity.ok(
            bookingService.getBookingsByEmail(auth.getName())
        );
    }

    // ✅ CANCEL BOOKING
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(
            @PathVariable Long id,
            Authentication auth
    ) {
        String role = auth.getAuthorities()
                .iterator().next().getAuthority();
        bookingService.cancelBooking(id, auth.getName(), role);
        return ResponseEntity.noContent().build();
    }

    // ✅ APPROVE BOOKING — admin only
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Booking> approve(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    // ✅ REJECT BOOKING — admin only
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Booking> reject(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.rejectBooking(id));
    }
}