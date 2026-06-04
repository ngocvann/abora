package com.abora.backend.auth;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class EmailServiceImpl implements EmailSender {

    @Value("${spring.resend.api-key}")
    private String resendApiKey;

    @Value("${spring.resend.from}")
    private String mailFrom;

    private final RestTemplate restTemplate = new RestTemplate();

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
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("from", mailFrom);
            body.put("to", toEmail);
            body.put("subject", subject);
            body.put("html", htmlContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            String url = "https://api.resend.com/emails";

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent successfully to via Resend: {}", toEmail);
            } else {
                log.error("Failed to send email to {} via Resend. Status code: {}, Response: {}", toEmail, response.getStatusCode(), response.getBody());
                throw new RuntimeException("Resend API error status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Failed to send email to {} due to error: {}", toEmail, e.getMessage());
            throw new RuntimeException("Lỗi hệ thống khi gửi email.");
        }
    }
}
