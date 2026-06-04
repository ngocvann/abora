package com.abora.backend.chapter;

import com.abora.backend.chapter.dto.ChapterResponse;
import com.abora.backend.chapter.dto.ChapterSummaryResponse;
import com.abora.backend.chapter.dto.CreateChapterRequest;
import com.abora.backend.chapter.dto.UpdateChapterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stories/{storyId:\\d+}/chapters")
@RequiredArgsConstructor
public class ChapterController {

    private final ChapterService chapterService;

    @PostMapping
    public ResponseEntity<ChapterResponse> createChapter(
            @PathVariable Long storyId,
            @Valid @RequestBody CreateChapterRequest request
    ) {
        ChapterResponse response = chapterService.createChapter(storyId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{chapterId}")
    public ResponseEntity<ChapterResponse> updateChapter(
            @PathVariable Long storyId,
            @PathVariable Long chapterId,
            @Valid @RequestBody UpdateChapterRequest request
    ) {
        ChapterResponse response = chapterService.updateChapter(storyId, chapterId, request);
        return ResponseEntity.ok(response);
    }

    
    @GetMapping("/management")
    public ResponseEntity<List<ChapterSummaryResponse>> getManagementChapters(
            @PathVariable Long storyId
    ) {
        return ResponseEntity.ok(chapterService.getChaptersForManagement(storyId));
    }

    @GetMapping("/{chapterId:\\d+}")
    public ResponseEntity<ChapterResponse> getChapter(
            @PathVariable Long storyId,
            @PathVariable Long chapterId
    ) {
        return ResponseEntity.ok(chapterService.getChapterForManagement(storyId, chapterId));
    }



    @DeleteMapping("/{chapterId}")
    public ResponseEntity<Void> deleteChapter(@PathVariable Long storyId, @PathVariable Long chapterId) {
        chapterService.deleteChapter(chapterId);
        return ResponseEntity.noContent().build();
    }

    // Reorder chapters
    @PutMapping("/reorder")
    public ResponseEntity<Void> reorderChapters(@PathVariable Long storyId, @RequestBody List<Long> orderedIds) {
        chapterService.reorderChapters(storyId, orderedIds);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{chapterId}/like")
    public ResponseEntity<Void> likeChapter(
            @PathVariable Long storyId,
            @PathVariable Long chapterId
    ) {
        chapterService.likeChapter(chapterId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{chapterId}/like")
    public ResponseEntity<Void> unlikeChapter(
            @PathVariable Long storyId,
            @PathVariable Long chapterId
    ) {
        chapterService.unlikeChapter(chapterId);
        return ResponseEntity.ok().build();
    }
}
