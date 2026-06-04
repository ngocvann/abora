package com.abora.backend.admin;

import com.abora.backend.common.dto.MessageResponse;
import com.abora.backend.moderation.ReportStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<Page<AdminReportResponse>> getReports(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) com.abora.backend.moderation.ReportTargetType targetType,
            Pageable pageable) {
        return ResponseEntity.ok(adminService.getReports(search, targetType, pageable));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MessageResponse> updateReportStatus(
            @PathVariable Long id,
            @RequestParam ReportStatus status,
            @RequestParam(required = false) String moderatorNote) {
        adminService.updateReportStatus(id, status, moderatorNote);
        return ResponseEntity.ok(new MessageResponse("Đã cập nhật trạng thái báo cáo."));
    }
}
