package com.abora.backend.chat;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.chat.dto.ChatMessageDto;
import com.abora.backend.chat.dto.ConversationDto;
import com.abora.backend.chat.dto.SendMessageRequest;
import com.abora.backend.common.dto.MessageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/send")
    public ResponseEntity<ChatMessageDto> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        ChatMessageDto dto = chatService.sendMessage(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/messages/{partnerId}")
    public ResponseEntity<List<ChatMessageDto>> getMessages(
            @PathVariable("partnerId") Long partnerId,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        List<ChatMessageDto> messages = chatService.getMessagesWith(partnerId, user.getId());
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto>> getConversations(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        List<ConversationDto> conversations = chatService.getConversations(user.getId());
        return ResponseEntity.ok(conversations);
    }

    @PutMapping("/read/{partnerId}")
    public ResponseEntity<MessageResponse> markAsRead(
            @PathVariable("partnerId") Long partnerId,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        chatService.markAsRead(partnerId, user.getId());
        return ResponseEntity.ok(new MessageResponse("Đã đánh dấu là đã đọc"));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        long count = chatService.getTotalUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
}
