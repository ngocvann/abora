package com.abora.backend.community;

import com.abora.backend.community.dto.CommentRequest;
import com.abora.backend.community.dto.CommentResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chapters/{chapterId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getChapterComments(@PathVariable Long chapterId) {
        return ResponseEntity.ok(commentService.getChapterComments(chapterId));
    }

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long chapterId,
            @Valid @RequestBody CommentRequest request
    ) {
        CommentResponse response = commentService.createComment(chapterId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long chapterId,
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request
    ) {
        return ResponseEntity.ok(commentService.updateComment(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long chapterId,
            @PathVariable Long id
    ) {
        commentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }
}
