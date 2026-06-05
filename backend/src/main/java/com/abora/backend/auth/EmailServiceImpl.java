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
        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Xác thực tài khoản Abora</title>
              <style>
                body {
                  background-color: #0b0f19;
                  color: #e2e8f0;
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  margin: 0;
                  padding: 0;
                  -webkit-font-smoothing: antialiased;
                }
                .container {
                  max-width: 550px;
                  margin: 40px auto;
                  background: #111827;
                  border: 1px solid #1f2937;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                }
                .header {
                  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                  padding: 35px 20px;
                  text-align: center;
                }
                .header h1 {
                  margin: 0;
                  color: #ffffff;
                  font-size: 28px;
                  font-weight: 800;
                  letter-spacing: 2px;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .header p {
                  margin: 5px 0 0 0;
                  color: #bfdbfe;
                  font-size: 14px;
                  font-weight: 400;
                }
                .body {
                  padding: 40px 30px;
                  text-align: center;
                }
                .body h2 {
                  margin-top: 0;
                  color: #ffffff;
                  font-size: 22px;
                  font-weight: 700;
                  letter-spacing: -0.5px;
                }
                .body p {
                  color: #9ca3af;
                  font-size: 15px;
                  line-height: 1.6;
                  margin: 0 0 25px 0;
                }
                .otp-box {
                  background: rgba(139, 92, 246, 0.1);
                  border: 1px dashed rgba(139, 92, 246, 0.4);
                  border-radius: 12px;
                  padding: 18px 30px;
                  display: inline-block;
                  margin: 10px 0 25px 0;
                }
                .otp-code {
                  font-size: 38px;
                  font-weight: 800;
                  color: #a78bfa;
                  letter-spacing: 8px;
                  margin: 0;
                  font-family: 'Courier New', Courier, monospace;
                }
                .footer {
                  padding: 24px;
                  background: #0b0f19;
                  text-align: center;
                  border-top: 1px solid #1f2937;
                }
                .footer p {
                  margin: 0 0 6px 0;
                  color: #4b5563;
                  font-size: 12px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Abora</h1>
                  <p>Nơi những câu chuyện tuyệt vời nhất được sinh ra</p>
                </div>
                <div class="body">
                  <h2>Xác thực tài khoản của bạn</h2>
                  <p>Cảm ơn bạn đã đăng ký tham gia cộng đồng Abora. Vui lòng sử dụng mã OTP dưới đây để hoàn tất việc xác thực địa chỉ email:</p>
                  <div class="otp-box">
                    <p class="otp-code">[OTP]</p>
                  </div>
                  <p style="font-size: 13px; color: #6b7280; margin-top: 10px;">
                    Mã OTP này có hiệu lực trong 24 giờ và chỉ dùng một lần. Tuyệt đối không chia sẻ mã này với người khác.
                  </p>
                </div>
                <div class="footer">
                  <p>&copy; 2026 Abora. Mọi quyền được bảo lưu.</p>
                  <p>Nếu bạn không đăng ký tài khoản tại Abora, vui lòng bỏ qua email này.</p>
                </div>
              </div>
            </body>
            </html>
            """.replace("[OTP]", otp);
        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String otp) {
        String subject = "[Abora] Đặt lại mật khẩu";
        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Đặt lại mật khẩu Abora</title>
              <style>
                body {
                  background-color: #0b0f19;
                  color: #e2e8f0;
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  margin: 0;
                  padding: 0;
                  -webkit-font-smoothing: antialiased;
                }
                .container {
                  max-width: 550px;
                  margin: 40px auto;
                  background: #111827;
                  border: 1px solid #1f2937;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                }
                .header {
                  background: linear-gradient(135deg, #c084fc, #6366f1);
                  padding: 35px 20px;
                  text-align: center;
                }
                .header h1 {
                  margin: 0;
                  color: #ffffff;
                  font-size: 28px;
                  font-weight: 800;
                  letter-spacing: 2px;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .header p {
                  margin: 5px 0 0 0;
                  color: #e0f2fe;
                  font-size: 14px;
                  font-weight: 400;
                }
                .body {
                  padding: 40px 30px;
                  text-align: center;
                }
                .body h2 {
                  margin-top: 0;
                  color: #ffffff;
                  font-size: 22px;
                  font-weight: 700;
                  letter-spacing: -0.5px;
                }
                .body p {
                  color: #9ca3af;
                  font-size: 15px;
                  line-height: 1.6;
                  margin: 0 0 25px 0;
                }
                .otp-box {
                  background: rgba(192, 132, 252, 0.1);
                  border: 1px dashed rgba(192, 132, 252, 0.4);
                  border-radius: 12px;
                  padding: 18px 30px;
                  display: inline-block;
                  margin: 10px 0 25px 0;
                }
                .otp-code {
                  font-size: 38px;
                  font-weight: 800;
                  color: #d8b4fe;
                  letter-spacing: 8px;
                  margin: 0;
                  font-family: 'Courier New', Courier, monospace;
                }
                .footer {
                  padding: 24px;
                  background: #0b0f19;
                  text-align: center;
                  border-top: 1px solid #1f2937;
                }
                .footer p {
                  margin: 0 0 6px 0;
                  color: #4b5563;
                  font-size: 12px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Abora</h1>
                  <p>Hệ thống bảo mật và tài khoản người dùng</p>
                </div>
                <div class="body">
                  <h2>Yêu cầu đặt lại mật khẩu</h2>
                  <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác thực gồm 6 chữ số dưới đây để đặt lại mật khẩu:</p>
                  <div class="otp-box">
                    <p class="otp-code">[OTP]</p>
                  </div>
                  <p style="font-size: 13px; color: #6b7280; margin-top: 10px;">
                    Mã xác thực này có hiệu lực trong 30 phút và chỉ sử dụng một lần. Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể an tâm bỏ qua email này.
                  </p>
                </div>
                <div class="footer">
                  <p>&copy; 2026 Abora. Mọi quyền được bảo lưu.</p>
                  <p>Nếu bạn gặp sự cố, vui lòng liên hệ bộ phận hỗ trợ của chúng tôi.</p>
                </div>
              </div>
            </body>
            </html>
            """.replace("[OTP]", otp);
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
