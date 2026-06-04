package com.abora.backend.admin;

import com.abora.backend.common.dto.MessageResponse;
import com.abora.backend.user.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<Page<AdminUserResponse>> getUsers(Pageable pageable) {
        return ResponseEntity.ok(adminService.getUsers(pageable));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MessageResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestParam UserStatus status) {
        adminService.updateUserStatus(id, status);
        return ResponseEntity.ok(new MessageResponse("Đã cập nhật trạng thái người dùng."));
    }
}
