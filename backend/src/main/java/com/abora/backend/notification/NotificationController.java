package com.abora.backend.notification;

import com.abora.backend.notification.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** Lấy 30 thông báo gần nhất */
    @GetMapping
    public List<NotificationDto> getMyNotifications() {
        return notificationService.getMyNotifications();
    }

    /** Đếm số thông báo chưa đọc (dùng cho badge trên Navbar) */
    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount() {
        return Map.of("count", notificationService.countUnread());
    }

    /** Đánh dấu tất cả là đã đọc khi user mở popover */
    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok().build();
    }
}
