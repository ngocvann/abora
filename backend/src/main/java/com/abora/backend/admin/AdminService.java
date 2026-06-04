package com.abora.backend.admin;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.community.CommentRepository;
import com.abora.backend.community.ReportRepository;
import com.abora.backend.post.PostRepository;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.moderation.Report;
import com.abora.backend.moderation.ReportStatus;
import com.abora.backend.story.Story;
import com.abora.backend.story.StoryRepository;
import com.abora.backend.story.StoryStatus;
import com.abora.backend.user.User;
import com.abora.backend.user.UserRepository;
import com.abora.backend.user.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final StoryRepository storyRepository;
    private final ReportRepository reportRepository;
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    public AdminStatsResponse getDashboardStats() {
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);

        long totalUsers = userRepository.count();
        long newUsersThisMonth = userRepository.countByCreatedAtAfter(thirtyDaysAgo);
        long totalStories = storyRepository.count();
        long newStoriesThisMonth = storyRepository.countByCreatedAtAfter(thirtyDaysAgo);
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);
        long totalComments = commentRepository.count();

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .newUsersThisMonth(newUsersThisMonth)
                .totalStories(totalStories)
                .newStoriesThisMonth(newStoriesThisMonth)
                .pendingReports(pendingReports)
                .totalComments(totalComments)
                .build();
    }

    public Page<AdminUserResponse> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(AdminUserResponse::fromUser);
    }

    public void updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại"));
        user.setStatus(status);
        userRepository.save(user);
    }

    public void updateUserStatus(Long userId, UserStatus status, Instant bannedUntil) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại"));
        user.setStatus(status);
        user.setBannedUntil(bannedUntil);
        userRepository.save(user);
    }

    public Page<AdminStoryResponse> getStories(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return storyRepository.searchStories(search, pageable).map(AdminStoryResponse::fromStory);
        }
        return storyRepository.findAll(pageable)
                .map(AdminStoryResponse::fromStory);
    }

    public void updateStoryStatus(Long storyId, StoryStatus status) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new NotFoundException("Truyện không tồn tại"));
        story.setStatus(status);
        storyRepository.save(story);
    }
    
    public Page<AdminReportResponse> getReports(String search, com.abora.backend.moderation.ReportTargetType targetType, Pageable pageable) {
        Page<Report> reports;
        if (targetType != null) {
            if (search != null && !search.trim().isEmpty()) {
                reports = reportRepository.searchReportsByType(search, targetType, pageable);
            } else {
                reports = reportRepository.findByTargetType(targetType, pageable);
            }
        } else {
            if (search != null && !search.trim().isEmpty()) {
                reports = reportRepository.searchReports(search, pageable);
            } else {
                reports = reportRepository.findAll(pageable);
            }
        }
        return reports.map(this::mapToAdminReportResponse);
    }

    private AdminReportResponse mapToAdminReportResponse(Report report) {
        AdminReportResponse res = AdminReportResponse.fromReport(report);
        userRepository.findById(report.getReporterId()).ifPresent(user -> res.setReporterUsername(user.getUsername()));
        
        switch (report.getTargetType()) {
            case STORY -> {
                storyRepository.findById(report.getTargetId()).ifPresentOrElse(story -> {
                    res.setTargetName(story.getTitle());
                    res.setTargetUrl("/story/" + story.getSlug());
                    res.setIsTargetDeleted(false);
                }, () -> res.setIsTargetDeleted(true));
            }
            case USER -> {
                userRepository.findById(report.getTargetId()).ifPresentOrElse(user -> {
                    res.setTargetName(user.getUsername());
                    res.setTargetUrl("/" + user.getUsername());
                    res.setIsTargetDeleted(false);
                }, () -> res.setIsTargetDeleted(true));
            }
            case COMMENT -> {
                commentRepository.findById(report.getTargetId()).ifPresentOrElse(comment -> {
                    res.setTargetName(comment.getContent());
                    res.setIsTargetDeleted(false);
                }, () -> res.setIsTargetDeleted(true));
            }
            case POST -> {
                postRepository.findById(report.getTargetId()).ifPresentOrElse(post -> {
                    res.setTargetName(post.getContent());
                    res.setTargetUrl("/post/" + post.getId());
                    res.setIsTargetDeleted(false);
                }, () -> res.setIsTargetDeleted(true));
            }
            case CHAPTER -> {
                // To be implemented fully if needed, we'll just set defaults
                res.setTargetName("Chapter #" + report.getTargetId());
                res.setIsTargetDeleted(false);
            }
        }
        return res;
    }

    public void updateReportStatus(Long reportId, ReportStatus status, String moderatorNote) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Báo cáo không tồn tại"));
        
        report.setStatus(status);
        if (moderatorNote != null && !moderatorNote.trim().isEmpty()) {
            report.setModeratorNote(moderatorNote);
        }

        if (status == ReportStatus.RESOLVED || status == ReportStatus.REJECTED) {
            report.setResolvedAt(java.time.LocalDateTime.now());
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof AuthenticatedUser u) {
                report.setResolvedBy(u.getId());
            }
        }

        reportRepository.save(report);
    }

    public void updateCommentStatus(Long commentId, com.abora.backend.community.CommentStatus status) {
        com.abora.backend.community.Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Bình luận không tồn tại"));
        comment.setStatus(status);
        commentRepository.save(comment);
    }
}
