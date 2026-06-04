package com.abora.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** Lấy 30 thông báo gần nhất của user, sắp theo mới nhất */
    List<Notification> findTop30ByUserIdOrderByCreatedAtDesc(Long userId);

    /** Đếm số thông báo chưa đọc */
    long countByUserIdAndReadFalse(Long userId);

    /** Đánh dấu tất cả thông báo của user là đã đọc */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
    void markAllAsReadByUserId(Long userId);
}
