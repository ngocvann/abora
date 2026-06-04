package com.abora.backend.admin;

import com.abora.backend.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final NotificationService notificationService;

    @PostMapping("/broadcast")
    public ResponseEntity<Void> broadcastNotification(@RequestBody Map<String, String> payload) {
        String message = payload.get("message");
        String targetUrl = payload.get("targetUrl");
        String targetUsername = payload.get("targetUsername");

        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        notificationService.broadcastNotification(message, targetUrl, targetUsername);
        return ResponseEntity.ok().build();
    }
}
