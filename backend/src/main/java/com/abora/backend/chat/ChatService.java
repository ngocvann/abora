package com.abora.backend.chat;

import com.abora.backend.chat.dto.ChatMessageDto;
import com.abora.backend.chat.dto.ConversationDto;
import com.abora.backend.chat.dto.SendMessageRequest;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.user.User;
import com.abora.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatMessageDto sendMessage(SendMessageRequest request, Long senderId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new NotFoundException("Người gửi không tồn tại"));

        User recipient = userRepository.findById(request.recipientId())
                .orElseThrow(() -> new NotFoundException("Người nhận không tồn tại"));

        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setContent(request.content());
        message.setRead(false);

        ChatMessage saved = chatMessageRepository.save(message);
        return toDto(saved);
    }

    @Transactional
    public List<ChatMessageDto> getMessagesWith(Long partnerId, Long currentUserId) {
        // Mark messages as read when fetched
        chatMessageRepository.markConversationAsRead(partnerId, currentUserId);

        return chatMessageRepository.findMessagesBetween(currentUserId, partnerId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getConversations(Long currentUserId) {
        List<Long> partnerIds = chatMessageRepository.findPartnerIds(currentUserId);
        List<ConversationDto> conversations = new ArrayList<>();

        for (Long partnerId : partnerIds) {
            User partner = userRepository.findById(partnerId).orElse(null);
            if (partner == null) continue;

            List<ChatMessage> messages = chatMessageRepository.findMessagesBetween(currentUserId, partnerId);
            if (messages.isEmpty()) continue;

            ChatMessage lastMsg = messages.get(messages.size() - 1);
            long unreadCount = chatMessageRepository.countUnreadFromPartner(partnerId, currentUserId);

            conversations.add(new ConversationDto(
                    partner.getId(),
                    partner.getUsername(),
                    partner.getDisplayName(),
                    partner.getAvatarUrl(),
                    lastMsg.getContent(),
                    lastMsg.getCreatedAt(),
                    unreadCount
            ));
        }

        // Sort by last message timestamp desc
        conversations.sort(Comparator.comparing(ConversationDto::lastMessageAt).reversed());
        return conversations;
    }

    @Transactional
    public void markAsRead(Long partnerId, Long currentUserId) {
        chatMessageRepository.markConversationAsRead(partnerId, currentUserId);
    }

    @Transactional(readOnly = true)
    public long getTotalUnreadCount(Long currentUserId) {
        return chatMessageRepository.countTotalUnread(currentUserId);
    }

    private ChatMessageDto toDto(ChatMessage m) {
        return new ChatMessageDto(
                m.getId(),
                m.getSender().getId(),
                m.getSender().getUsername(),
                m.getSender().getDisplayName(),
                m.getSender().getAvatarUrl(),
                m.getRecipient().getId(),
                m.getContent(),
                m.isRead(),
                m.getCreatedAt()
        );
    }
}
