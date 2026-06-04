package com.abora.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bộ giới hạn tần suất request đơn giản dùng in-memory sliding-window counter.
 * Phù hợp cho v1 (single-node). Upgrade lên Redis khi scale multi-node.
 *
 * <p>Cấu hình qua RateLimitRule: mỗi rule khớp theo prefix URL và giới hạn
 * số request tối đa trong khoảng thời gian nhất định (tính theo IP).</p>
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    /** Cấu hình các rule giới hạn */
    private static final RateLimitRule[] RULES = {
        // API quên mật khẩu: tối đa 5 request/giờ/IP
        new RateLimitRule("/api/auth/forgot-password", 5, 3600),
        // API comment: tối đa 15 request/phút/IP
        new RateLimitRule("/api/community/comments", 15, 60),
    };

    /** key = "IP::urlPrefix", value = WindowCounter */
    private final ConcurrentHashMap<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws IOException {

        String path = request.getRequestURI();
        String ip   = resolveClientIp(request);

        for (RateLimitRule rule : RULES) {
            if (path.startsWith(rule.urlPrefix())) {
                String key = ip + "::" + rule.urlPrefix();

                WindowCounter counter = counters.compute(key, (k, existing) -> {
                    Instant now = Instant.now();
                    if (existing == null || now.isAfter(existing.windowEnd())) {
                        return new WindowCounter(1, now.plusSeconds(rule.windowSeconds()));
                    }
                    return new WindowCounter(existing.count() + 1, existing.windowEnd());
                });

                if (counter.count() > rule.maxRequests()) {
                    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(
                        "{\"message\":\"Quá nhiều yêu cầu. Vui lòng thử lại sau.\"}"
                    );
                    return false;
                }
                break; // chỉ apply rule đầu tiên khớp
            }
        }
        return true;
    }

    /** Hỗ trợ X-Forwarded-For khi đứng sau proxy/load-balancer */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // ─── Inner types ──────────────────────────────────────────────────────────

    private record RateLimitRule(String urlPrefix, int maxRequests, long windowSeconds) {}

    private record WindowCounter(int count, Instant windowEnd) {}
}
