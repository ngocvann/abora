package com.abora.backend.community;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.chapter.Chapter;
import com.abora.backend.chapter.ChapterRepository;
import com.abora.backend.chapter.ChapterStatus;
import com.abora.backend.common.exception.BadRequestException;
import com.abora.backend.common.exception.ForbiddenException;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.community.dto.CommentRequest;
import com.abora.backend.community.dto.CommentResponse;
import com.abora.backend.notification.NotificationService;
import com.abora.backend.notification.NotificationType;
import com.abora.backend.user.User;
import com.abora.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final ChapterRepository chapterRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final com.abora.backend.story.StoryRepository storyRepository;

    @Transactional
    public CommentResponse createComment(Long chapterId, CommentRequest request) {
        Long userId = getCurrentUserId();
        User user = userRepository.getReferenceById(userId);

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter not found"));
        
        boolean isAuthor = chapter.getStory().getAuthor().getId().equals(userId);
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (chapter.getStatus() != ChapterStatus.PUBLISHED && !isAuthor && !isAdmin) {
            throw new BadRequestException("Cannot comment on unpublished chapter");
        }

        Comment comment = new Comment();
        comment.setContent(request.content());
        comment.setUser(user);
        comment.setChapter(chapter);
        comment.setStory(chapter.getStory());
        comment.setParagraphHash(request.paragraphHash());

        if (request.parentId() != null) {
            Comment parent = commentRepository.findById(request.parentId())
                    .orElseThrow(() -> new NotFoundException("Parent comment not found"));
            if (parent.getChapter() == null || !parent.getChapter().getId().equals(chapterId)) {
                throw new BadRequestException("Parent comment does not belong to this chapter");
            }
            if (parent.getParent() != null) {
                // To keep it 2-level threaded, if parent itself has a parent, link to the top parent
                comment.setParent(parent.getParent());
            } else {
                comment.setParent(parent);
            }
        }

        comment = commentRepository.save(comment);

        chapter.setCommentCount(chapter.getCommentCount() + 1);
        chapterRepository.save(chapter);

        com.abora.backend.story.Story story = chapter.getStory();
        story.setCommentCount(story.getCommentCount() + 1);
        storyRepository.save(story);

        // Gửi thông báo cho chủ comment gốc khi có reply
        if (comment.getParent() != null) {
            Long parentAuthorId = comment.getParent().getUser().getId();
            String actorName = user.getDisplayName();
            String storyTitle = chapter.getStory().getTitle();
            notificationService.createNotification(
                    parentAuthorId,
                    userId,
                    NotificationType.COMMENT_REPLY,
                    "COMMENT",
                    comment.getParent().getId(),
                    actorName + " đã trả lời bình luận của bạn trong truyện \"" + storyTitle + "\"",
                    "/story/" + chapter.getStory().getSlug() + "/chapter/" + chapter.getChapterNumber()
            );
        }

        return mapToResponse(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getChapterComments(Long chapterId) {
        // Validate chapter exists
        if (!chapterRepository.existsById(chapterId)) {
            throw new NotFoundException("Chapter not found");
        }

        return commentRepository.findByChapterIdAndParentIsNullOrderByCreatedAtDesc(chapterId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private CommentResponse mapToResponse(Comment comment) {
        List<CommentResponse> replies = comment.getReplies() == null ? List.of() : comment.getReplies().stream()
                .filter(r -> r.getStatus() == CommentStatus.ACTIVE)
                .map(this::mapToResponse)
                .toList();
        
        User user = comment.getUser();
        return new CommentResponse(
                comment.getId(),
                comment.getChapter() != null ? comment.getChapter().getId() : null,
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                comment.getContent(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                replies,
                comment.getCreatedAt(),
                comment.getParagraphHash()
        );
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, CommentRequest request) {
        Long userId = getCurrentUserId();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found"));
        
        if (!comment.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Not authorized to update this comment");
        }

        comment.setContent(request.content());
        comment = commentRepository.save(comment);
        return mapToResponse(comment);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        Long userId = getCurrentUserId();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found"));
        
        boolean isCommentAuthor = comment.getUser().getId().equals(userId);
        boolean isStoryAuthor = comment.getStory() != null && comment.getStory().getAuthor().getId().equals(userId);
        
        if (!isCommentAuthor && !isStoryAuthor) {
            throw new ForbiddenException("Not authorized to delete this comment");
        }

        comment.setStatus(CommentStatus.DELETED);
        commentRepository.save(comment);

        if (comment.getChapter() != null) {
            Chapter chapter = comment.getChapter();
            chapter.setCommentCount(Math.max(0, chapter.getCommentCount() - 1));
            chapterRepository.save(chapter);

            com.abora.backend.story.Story story = chapter.getStory();
            story.setCommentCount(Math.max(0, story.getCommentCount() - 1));
            storyRepository.save(story);
        }
    }

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return user.getId();
        }
        throw new ForbiddenException("User not authenticated");
    }
}
