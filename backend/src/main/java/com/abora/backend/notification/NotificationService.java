package com.abora.backend.notification;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.common.exception.ForbiddenException;
import com.abora.backend.notification.dto.NotificationDto;
import com.abora.backend.user.User;
import com.abora.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // ─── Public API ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NotificationDto> getMyNotifications() {
        Long userId = getCurrentUserId();
        return notificationRepository.findTop30ByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnread() {
        return notificationRepository.countByUserIdAndReadFalse(getCurrentUserId());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Long userId = getCurrentUserId();
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ForbiddenException("Notification not found"));
        if (!n.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Not your notification");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead() {
        Long userId = getCurrentUserId();
        notificationRepository.markAllAsReadByUserId(userId);
    }

    /**
     * Tạo thông báo cho một user cụ thể.
     * Gọi bên trong @Transactional của caller.
     */
    @Transactional
    public void createNotification(Long recipientUserId, Long actorId,
                                   NotificationType type, String entityType,
                                   Long entityId, String message, String targetUrl) {
        // Không gửi thông báo cho chính mình
        if (actorId != null && actorId.equals(recipientUserId)) return;

        User recipient = userRepository.getReferenceById(recipientUserId);

        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setActorId(actorId);
        notification.setType(type);
        notification.setEntityType(entityType);
        notification.setEntityId(entityId);
        notification.setMessage(message);
        notification.setTargetUrl(targetUrl);

        notificationRepository.save(notification);
    }

    /**
     * Broadcast notification to one user or all users.
     */
    @Transactional
    public void broadcastNotification(String message, String targetUrl, String targetUsername) {
        Long adminId = getCurrentUserId();
        
        if (targetUsername != null && !targetUsername.isBlank()) {
            User target = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            createNotification(target.getId(), adminId, NotificationType.SYSTEM_ALERT, null, null, message, targetUrl);
        } else {
            List<Long> allUserIds = userRepository.findAllIds();
            List<Notification> batch = new java.util.ArrayList<>();
            for (Long uid : allUserIds) {
                User recipient = userRepository.getReferenceById(uid);
                Notification notification = new Notification();
                notification.setUser(recipient);
                notification.setActorId(adminId);
                notification.setType(NotificationType.SYSTEM_ALERT);
                notification.setMessage(message);
                notification.setTargetUrl(targetUrl);
                batch.add(notification);
            }
            notificationRepository.saveAll(batch);
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getType(),
                n.getMessage(),
                n.getEntityType(),
                n.getEntityId(),
                n.getActorId(),
                n.isRead(),
                n.getCreatedAt(),
                n.getTargetUrl()
        );
    }

    private Long getCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthenticatedUser u) {
            return u.getId();
        }
        throw new ForbiddenException("User not authenticated");
    }
}
