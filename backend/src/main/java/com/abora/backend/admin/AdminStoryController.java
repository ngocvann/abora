package com.abora.backend.admin;

import com.abora.backend.common.dto.MessageResponse;
import com.abora.backend.story.StoryStatus;
import com.abora.backend.story.StoryStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/stories")
@RequiredArgsConstructor
public class AdminStoryController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<Page<AdminStoryResponse>> getStories(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(adminService.getStories(search, pageable));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MessageResponse> updateStoryStatus(
            @PathVariable Long id,
            @RequestParam StoryStatus status) {
        adminService.updateStoryStatus(id, status);
        return ResponseEntity.ok(new MessageResponse("Đã cập nhật trạng thái truyện."));
    }
}
