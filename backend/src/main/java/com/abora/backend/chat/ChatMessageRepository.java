package com.abora.backend.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.sender.id = :u1 AND m.recipient.id = :u2) OR " +
           "(m.sender.id = :u2 AND m.recipient.id = :u1) " +
           "ORDER BY m.createdAt ASC")
    List<ChatMessage> findMessagesBetween(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT DISTINCT CASE WHEN m.sender.id = :userId THEN m.recipient.id ELSE m.sender.id END " +
           "FROM ChatMessage m WHERE m.sender.id = :userId OR m.recipient.id = :userId")
    List<Long> findPartnerIds(@Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.recipient.id = :userId AND m.isRead = false")
    long countTotalUnread(@Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.sender.id = :partnerId AND m.recipient.id = :userId AND m.isRead = false")
    long countUnreadFromPartner(@Param("partnerId") Long partnerId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.sender.id = :senderId AND m.recipient.id = :recipientId AND m.isRead = false")
    void markConversationAsRead(@Param("senderId") Long senderId, @Param("recipientId") Long recipientId);
}
