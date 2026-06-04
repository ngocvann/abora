package com.abora.backend.admin;

import com.abora.backend.moderation.Report;
import com.abora.backend.moderation.ReportStatus;
import com.abora.backend.moderation.ReportTargetType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminReportResponse {
    private Long id;
    private Long reporterId;
    private ReportTargetType targetType;
    private Long targetId;
    private String reason;
    private ReportStatus status;
    private String moderatorNote;
    private LocalDateTime resolvedAt;
    private Long resolvedBy;
    private LocalDateTime createdAt;
    private String reporterUsername;
    private String targetName;
    private String targetUrl;
    private Boolean isTargetDeleted;

    public static AdminReportResponse fromReport(Report report) {
        return AdminReportResponse.builder()
                .id(report.getId())
                .reporterId(report.getReporterId())
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .reason(report.getReason())
                .status(report.getStatus())
                .moderatorNote(report.getModeratorNote())
                .resolvedAt(report.getResolvedAt())
                .resolvedBy(report.getResolvedBy())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
