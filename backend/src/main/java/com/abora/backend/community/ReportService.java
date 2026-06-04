package com.abora.backend.community;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.common.exception.ForbiddenException;
import com.abora.backend.community.dto.ReportRequest;
import com.abora.backend.moderation.Report;
import com.abora.backend.moderation.ReportStatus;
import com.abora.backend.moderation.ReportTargetType;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;

    @Transactional
    public void createReport(ReportRequest request) {
        Long userId = getCurrentUserId();

        Report report = new Report();
        report.setReporterId(userId);
        report.setTargetType(ReportTargetType.valueOf(request.targetType().toUpperCase()));
        report.setTargetId(request.targetId());
        report.setReason(request.reason());
        report.setStatus(ReportStatus.PENDING);

        reportRepository.save(report);
    }

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser authUser) {
            return authUser.getId();
        }
        throw new ForbiddenException("User not authenticated");
    }
}
