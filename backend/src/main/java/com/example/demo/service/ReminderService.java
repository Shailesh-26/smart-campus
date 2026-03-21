package com.example.demo.service;

import com.example.demo.model.Booking;
import com.example.demo.model.BookingStatus;
import com.example.demo.repository.BookingRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ReminderService {

    private final BookingRepository bookingRepository;
    private final EmailService emailService;

    // ✅ Tracks booking IDs that have already been reminded
    // ConcurrentHashMap used for thread safety with @Scheduled
    private final Set<Long> remindedBookingIds = ConcurrentHashMap.newKeySet();

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    public ReminderService(BookingRepository bookingRepository,
                           EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.emailService      = emailService;
    }

    // ✅ Runs every 60 seconds
    // Finds APPROVED bookings starting between 25 and 35 minutes from now
    // Sends reminder email once per booking (tracked in remindedBookingIds)
    @Scheduled(fixedDelay = 60_000)
    public void sendUpcomingBookingReminders() {
        LocalDateTime now       = LocalDateTime.now();
        LocalDateTime windowStart = now.plusMinutes(25);
        LocalDateTime windowEnd   = now.plusMinutes(35);

        List<Booking> upcoming = bookingRepository
                .findByStatusAndStartTimeBetween(BookingStatus.APPROVED, windowStart, windowEnd);

        for (Booking booking : upcoming) {
            // Skip if already reminded
            if (remindedBookingIds.contains(booking.getId())) {
                continue;
            }

            try {
                emailService.sendBookingReminder(
                    booking.getBookedBy().getEmail(),
                    booking.getRoom().getRoomNumber(),
                    booking.getStartTime().format(FORMATTER),
                    booking.getEndTime().format(FORMATTER)
                );

                // Mark as reminded so we don't send again
                remindedBookingIds.add(booking.getId());

                System.out.println(">>> REMINDER sent to "
                    + booking.getBookedBy().getEmail()
                    + " for booking #" + booking.getId()
                    + " starting at " + booking.getStartTime().format(FORMATTER));

            } catch (Exception e) {
                System.err.println(">>> REMINDER FAILED for booking #"
                    + booking.getId() + ": " + e.getMessage());
            }
        }
    }
}