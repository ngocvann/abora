package com.abora.backend.auth;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

//@Service
@Slf4j
public class ConsoleEmailSender implements EmailSender {

    @Override
    public void sendVerificationEmail(String toEmail, String otp) {
        log.info("[EMAIL - Verification] To: {} | OTP: {}", toEmail, otp);
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String otp) {
        log.info("[EMAIL - Password Reset] To: {} | OTP: {}", toEmail, otp);
    }
}