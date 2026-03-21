package com.example.demo.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ✅ BOOKING APPROVED
    public void sendBookingApproved(String toEmail, String roomNumber,
                                     String startTime, String endTime) {
        String subject = "✅ Booking Approved — Smart Campus";
        String body = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #0f172a;">Your Booking has been Approved!</h2>
                <p style="color: #475569;">Great news! Your room booking request has been approved by the admin.</p>
                <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #0f172a;"><strong>Room:</strong> %s</p>
                    <p style="margin: 8px 0 0; color: #0f172a;"><strong>From:</strong> %s</p>
                    <p style="margin: 8px 0 0; color: #0f172a;"><strong>To:</strong> %s</p>
                </div>
                <p style="color: #475569;">Please arrive on time. If you need to cancel, log in to Smart Campus and cancel before the booking starts.</p>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">Smart Campus Room Booking System</p>
            </div>
            """.formatted(roomNumber, startTime, endTime);
        sendHtmlEmail(toEmail, subject, body);
    }

    // ✅ BOOKING REJECTED
    public void sendBookingRejected(String toEmail, String roomNumber,
                                     String startTime, String endTime) {
        String subject = "❌ Booking Rejected — Smart Campus";
        String body = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #0f172a;">Your Booking has been Rejected</h2>
                <p style="color: #475569;">Unfortunately, your room booking request has been rejected by the admin.</p>
                <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #0f172a;"><strong>Room:</strong> %s</p>
                    <p style="margin: 8px 0 0; color: #0f172a;"><strong>From:</strong> %s</p>
                    <p style="margin: 8px 0 0; color: #0f172a;"><strong>To:</strong> %s</p>
                </div>
                <p style="color: #475569;">You can submit a new booking request for a different time slot or room.</p>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">Smart Campus Room Booking System</p>
            </div>
            """.formatted(roomNumber, startTime, endTime);
        sendHtmlEmail(toEmail, subject, body);
    }

    // ✅ BOOKING REMINDER — 30 mins before
    public void sendBookingReminder(String toEmail, String roomNumber,
                                     String startTime, String endTime) {
        String subject = "⏰ Reminder: Your booking starts in 30 minutes — Smart Campus";
        String body = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #92400e; font-weight: bold;">⏰ Your booking starts in approximately 30 minutes</p>
                </div>
                <h2 style="color: #0f172a;">Booking Reminder</h2>
                <p style="color: #475569;">This is a friendly reminder that you have an upcoming room booking.</p>
                <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #0f172a;"><strong>Room:</strong> %s</p>
                    <p style="margin: 8px 0 0; color: #0f172a;"><strong>From:</strong> %s</p>
                    <p style="margin: 8px 0 0; color: #0f172a;"><strong>To:</strong> %s</p>
                </div>
                <p style="color: #475569;">Please make sure to arrive on time. If your plans have changed, log in to Smart Campus to cancel your booking.</p>
                <a href="http://localhost:5173/my-bookings"
                   style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
                   View My Bookings
                </a>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">Smart Campus Room Booking System</p>
            </div>
            """.formatted(roomNumber, startTime, endTime);
        sendHtmlEmail(toEmail, subject, body);
    }

    // ✅ SHARED HTML SENDER
    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }
}