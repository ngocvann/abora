package com.abora.backend.post;

import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.post.dto.*;
import com.abora.backend.user.User;
import com.abora.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final UserRepository userRepository;
    private final com.abora.backend.notification.NotificationService notificationService;

    @Transactional
    public PostResponse createPost(CreatePostRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại"));

        Post post = new Post();
        post.setUser(user);
        post.setContent(request.content());
        post.setType(request.type());
        
        Post savedPost = postRepository.save(post);
        return toPostResponse(savedPost, userId);
    }


    @Transactional(readOnly = true)
    public java.util.List<PostResponse> getUserTimeline(Long targetUserId, Long currentUserId) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(targetUserId).stream()
                .map(post -> toPostResponse(post, currentUserId)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getForumPosts(Pageable pageable, Long currentUserId) {
        Page<Post> posts = postRepository.findAllByOrderByCreatedAtDesc(pageable);
        return posts.map(post -> toPostResponse(post, currentUserId));
    }

    @Transactional(readOnly = true)
    public PostResponse getPostById(Long postId, Long currentUserId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài viết"));
        return toPostResponse(post, currentUserId);
    }

    @Transactional
    public void toggleLike(Long postId, Long userId) {
        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Bài viết không tồn tại");
        }

        PostLikeId likeId = new PostLikeId(postId, userId);
        postLikeRepository.findById(likeId)
                .ifPresentOrElse(
                        postLikeRepository::delete,
                        () -> {
                            postLikeRepository.save(new PostLike(postId, userId));
                            // Notify author
                            Post post = postRepository.findById(postId).orElse(null);
                            if (post != null) {
                                User liker = userRepository.findById(userId).orElse(null);
                                if (liker != null) {
                                    notificationService.createNotification(
                                        post.getUser().getId(),
                                        userId,
                                        com.abora.backend.notification.NotificationType.LIKE_POST,
                                        "POST",
                                        postId,
                                        liker.getDisplayName() + " đã thích bài viết của bạn.",
                                        "/post/" + postId
                                    );
                                }
                            }
                        }
                );
    }

    @Transactional
    public CommentResponse createComment(CreateCommentRequest request, Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Bài viết không tồn tại"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Người dùng không tồn tại"));

        PostComment comment = new PostComment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setContent(request.content());
        
        if (request.parentId() != null) {
            PostComment parent = postCommentRepository.findById(request.parentId())
                    .orElseThrow(() -> new NotFoundException("Bình luận gốc không tồn tại"));
            comment.setParent(parent);
        }

        PostComment savedComment = postCommentRepository.save(comment);

        // Notify post author or parent comment author
        if (request.parentId() != null) {
            notificationService.createNotification(
                savedComment.getParent().getUser().getId(),
                userId,
                com.abora.backend.notification.NotificationType.COMMENT_REPLY,
                "COMMENT",
                savedComment.getId(),
                user.getDisplayName() + " đã trả lời bình luận của bạn.",
                "/post/" + postId
            );
        } else {
            notificationService.createNotification(
                post.getUser().getId(),
                userId,
                com.abora.backend.notification.NotificationType.COMMENT_REPLY,
                "POST",
                postId,
                user.getDisplayName() + " đã bình luận về bài viết của bạn.",
                "/post/" + postId
            );
        }

        return toCommentResponse(savedComment);
    }

    @Transactional
    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Bài viết không tồn tại"));
        
        if (!post.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Không có quyền xóa bài viết này");
        }
        
        postCommentRepository.deleteByPostId(postId);
        postLikeRepository.deleteByPostId(postId);
        postRepository.delete(post);
    }

    @Transactional
    public PostResponse updatePost(Long postId, String content, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài viết"));
                
        if (!post.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Không có quyền chỉnh sửa bài viết này");
        }
        
        post.setContent(content);
        Post savedPost = postRepository.save(post);
        return toPostResponse(savedPost, userId);
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, String content, Long userId) {
        PostComment comment = postCommentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bình luận"));
                
        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Không có quyền chỉnh sửa bình luận này");
        }
        
        comment.setContent(content);
        PostComment savedComment = postCommentRepository.save(comment);
        return toCommentResponse(savedComment);
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        PostComment comment = postCommentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bình luận"));
                
        boolean isCommentAuthor = comment.getUser().getId().equals(userId);
        boolean isPostAuthor = comment.getPost().getUser().getId().equals(userId);
        
        if (!isCommentAuthor && !isPostAuthor) {
            throw new IllegalArgumentException("Không có quyền xóa bình luận này");
        }
        
        postCommentRepository.delete(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Bài viết không tồn tại");
        }
        return postCommentRepository.findByPostIdAndParentIsNullOrderByCreatedAtAsc(postId)
                .stream()
                .map(this::toCommentResponse)
                .collect(Collectors.toList());
    }

    // ─── Mapper Helpers ──────────────────────────────────────────────────────

    private PostResponse toPostResponse(Post post, Long currentUserId) {
        long likeCount = postLikeRepository.countByIdPostId(post.getId());
        long commentCount = postCommentRepository.countByPostId(post.getId());

        boolean isLikedByMe = false;
        if (currentUserId != null) {
            isLikedByMe = postLikeRepository.existsByIdPostIdAndIdUserId(post.getId(), currentUserId);
        }

        User author = post.getUser();
        return new PostResponse(
                post.getId(),
                author.getId(),
                author.getUsername(),
                author.getDisplayName(),
                author.getAvatarUrl(),
                post.getContent(),
                post.getType(),
                post.getCreatedAt(),
                likeCount,
                commentCount,
                isLikedByMe
        );
    }

    private CommentResponse toCommentResponse(PostComment comment) {
        User commenter = comment.getUser();
        java.util.List<CommentResponse> replies = comment.getReplies() != null
                ? comment.getReplies().stream().map(this::toCommentResponse).collect(Collectors.toList())
                : new java.util.ArrayList<>();
        return new CommentResponse(
                comment.getId(),
                comment.getPost().getId(),
                commenter.getId(),
                commenter.getUsername(),
                commenter.getDisplayName(),
                commenter.getAvatarUrl(),
                comment.getContent(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                replies,
                comment.getCreatedAt()
        );
    }
}
