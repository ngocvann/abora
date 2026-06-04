package com.abora.backend.post;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.common.dto.MessageResponse;
import com.abora.backend.post.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        PostResponse response = postService.createPost(request, authenticatedUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/forum")
    public ResponseEntity<Page<PostResponse>> getForumPosts(
            @PageableDefault(size = 15) Pageable pageable,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        Long currentUserId = (authenticatedUser != null) ? authenticatedUser.getId() : null;
        return ResponseEntity.ok(postService.getForumPosts(pageable, currentUserId));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse> getPostById(
            @PathVariable("postId") Long postId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        Long currentUserId = (authenticatedUser != null) ? authenticatedUser.getId() : null;
        return ResponseEntity.ok(postService.getPostById(postId, currentUserId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PostResponse>> getUserTimeline(
            @PathVariable("userId") Long userId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        Long currentUserId = (authenticatedUser != null) ? authenticatedUser.getId() : null;
        return ResponseEntity.ok(postService.getUserTimeline(userId, currentUserId));
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<MessageResponse> toggleLike(
            @PathVariable("postId") Long postId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        postService.toggleLike(postId, authenticatedUser.getId());
        return ResponseEntity.ok(new MessageResponse("Đã cập nhật lượt thích"));
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable("postId") Long postId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        CommentResponse response = postService.createComment(request, postId, authenticatedUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable("postId") Long postId) {
        return ResponseEntity.ok(postService.getComments(postId));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable("postId") Long postId,
            @RequestBody java.util.Map<String, String> request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        String content = request.get("content");
        PostResponse response = postService.updatePost(postId, content, authenticatedUser.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<MessageResponse> deletePost(
            @PathVariable("postId") Long postId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        postService.deletePost(postId, authenticatedUser.getId());
        return ResponseEntity.ok(new MessageResponse("Đã xóa bài viết"));
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable("commentId") Long commentId,
            @RequestBody java.util.Map<String, String> request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        String content = request.get("content");
        CommentResponse response = postService.updateComment(commentId, content, authenticatedUser.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<MessageResponse> deleteComment(
            @PathVariable("commentId") Long commentId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        postService.deleteComment(commentId, authenticatedUser.getId());
        return ResponseEntity.ok(new MessageResponse("Đã xóa bình luận"));
    }
}
