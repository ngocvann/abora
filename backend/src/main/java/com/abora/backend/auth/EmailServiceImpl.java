package com.abora.backend.auth;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailSender {

    private final JavaMailSender mailSender;

    @Override
    public void sendVerificationEmail(String toEmail, String otp) {
        String subject = "[Abora] Xác thực tài khoản của bạn";
        String htmlContent = String.format("""
            <h3>Xác thực tài khoản</h3>
            <p>Mã OTP của bạn là: <strong>%s</strong></p>
            <p>Mã này có hiệu lực trong 24 giờ. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
            """, otp);
        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetUrl) {
        String subject = "[Abora] Đặt lại mật khẩu";
        String htmlContent = String.format("""
            <h3>Đặt lại mật khẩu</h3>
            <p>Vui lòng click vào link sau để đặt lại mật khẩu của bạn:</p>
            <p><a href="%s">%s</a></p>
            """, resetUrl, resetUrl);
        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.setFrom("ngcvan04@gmail.com", "Abora");

            mailSender.send(message);
            log.info("Email sent successfully to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Lỗi gửi email: " + e.getMessage());
        } catch (Exception e) {
            log.error("Failed to send email to {} due to unexpected error: {}", toEmail, e.getMessage());
            throw new RuntimeException("Lỗi hệ thống khi gửi email.");
        }
    }
}
