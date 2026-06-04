package com.abora.backend.admin;

import com.abora.backend.common.dto.MessageResponse;
import com.abora.backend.community.CommentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/comments")
@RequiredArgsConstructor
public class AdminCommentController {

    private final AdminService adminService;

    @PutMapping("/{id}/status")
    public ResponseEntity<MessageResponse> updateCommentStatus(
            @PathVariable Long id,
            @RequestParam CommentStatus status) {
        adminService.updateCommentStatus(id, status);
        return ResponseEntity.ok(new MessageResponse("Đã cập nhật trạng thái bình luận."));
    }
}
