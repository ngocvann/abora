package com.abora.backend.story;

import com.abora.backend.chapter.ChapterService;
import com.abora.backend.chapter.dto.ReadChapterResponse;
import com.abora.backend.story.dto.CreateStoryRequest;
import com.abora.backend.story.dto.PublicStoryDetailResponse;
import com.abora.backend.story.dto.StoryResponse;
import com.abora.backend.story.dto.UpdateStoryRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;
    private final ChapterService chapterService;

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<StoryResponse>> getPublicStories(
            @org.springframework.data.web.PageableDefault(size = 10) org.springframework.data.domain.Pageable pageable
    ) {
        return ResponseEntity.ok(storyService.getPublicStories(pageable));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<PublicStoryDetailResponse> getPublicStoryDetail(@PathVariable String slug) {
        return ResponseEntity.ok(storyService.getPublicStoryDetail(slug));
    }

    @GetMapping("/{slug:.*[^0-9].*}/chapters/{chapterSlug}")
    public ResponseEntity<ReadChapterResponse> readChapter(
            @PathVariable String slug,
            @PathVariable String chapterSlug,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(chapterService.readChapter(slug, chapterSlug, request.getRemoteAddr()));
    }

    @PostMapping
    public ResponseEntity<StoryResponse> createStory(@Valid @RequestBody CreateStoryRequest request) {
        StoryResponse response = storyService.createStory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StoryResponse> updateStory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStoryRequest request
    ) {
        StoryResponse response = storyService.updateStory(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStory(@PathVariable Long id) {
        storyService.deleteStory(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cover")
    public ResponseEntity<StoryResponse> uploadCover(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        StoryResponse response = storyService.uploadCover(id, file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/management")
    public ResponseEntity<java.util.List<StoryResponse>> getManagementStories() {
        return ResponseEntity.ok(storyService.getAuthorStories());
    }

    @GetMapping("/management/{id}")
    public ResponseEntity<StoryResponse> getStoryForManagement(@PathVariable Long id) {
        return ResponseEntity.ok(storyService.getStoryByIdForManagement(id));
    }

    @GetMapping("/recommend/reading")
    public ResponseEntity<java.util.List<StoryResponse>> getReadingStories() {
        return ResponseEntity.ok(storyService.getReadingStories());
    }

    @GetMapping("/recommend/trending")
    public ResponseEntity<java.util.List<StoryResponse>> getTrendingStories() {
        return ResponseEntity.ok(storyService.getTrendingStories());
    }

    @GetMapping("/recommend/personalized")
    public ResponseEntity<java.util.List<StoryResponse>> getPersonalizedRecommendations() {
        return ResponseEntity.ok(storyService.getPersonalizedRecommendations());
    }

    @GetMapping("/recommendations")
    public ResponseEntity<java.util.List<StoryResponse>> getPersonalizedRecommendationsAlternative() {
        return ResponseEntity.ok(storyService.getPersonalizedRecommendations());
    }

    @GetMapping("/search")
    public ResponseEntity<java.util.List<StoryResponse>> searchStories(@RequestParam("q") String query) {
        return ResponseEntity.ok(storyService.searchStories(query));
    }

    @GetMapping("/leaderboard/viewed")
    public ResponseEntity<java.util.List<StoryResponse>> getViewedLeaderboard(@RequestParam(value = "period", defaultValue = "all") String period) {
        return ResponseEntity.ok(storyService.getViewedLeaderboard(period));
    }

    @GetMapping("/leaderboard/voted")
    public ResponseEntity<java.util.List<StoryResponse>> getVotedLeaderboard() {
        return ResponseEntity.ok(storyService.getVotedLeaderboard());
    }

    @GetMapping("/leaderboard/tags")
    public ResponseEntity<java.util.List<com.abora.backend.story.dto.TagLeaderboardProjection>> getTagsLeaderboard() {
        return ResponseEntity.ok(storyService.getTagsLeaderboard());
    }

    @GetMapping("/leaderboard/authors")
    public ResponseEntity<java.util.List<com.abora.backend.story.dto.AuthorLeaderboardProjection>> getAuthorsLeaderboard() {
        return ResponseEntity.ok(storyService.getAuthorsLeaderboard());
    }
}
