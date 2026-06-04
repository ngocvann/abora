package com.abora.backend.auth;

public interface EmailSender {
    void sendVerificationEmail(String toEmail, String otp);
    void sendPasswordResetEmail(String toEmail, String resetUrl);
}
