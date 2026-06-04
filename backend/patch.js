const fs = require('fs');

const storyCtrlPath = 'D:/abora/backend/src/main/java/com/abora/backend/story/StoryController.java';
let storyCtrl = fs.readFileSync(storyCtrlPath, 'utf8');
storyCtrl = storyCtrl.replace('@GetMapping("/{slug}/chapters/{chapterNumber}")', '@GetMapping("/{slug}/chapters/{chapterNumber:\\\\d+}")');
fs.writeFileSync(storyCtrlPath, storyCtrl);

const chapterCtrlPath = 'D:/abora/backend/src/main/java/com/abora/backend/chapter/ChapterController.java';
let chapterCtrl = fs.readFileSync(chapterCtrlPath, 'utf8');
chapterCtrl = chapterCtrl.replace('@GetMapping("/{chapterId}")', '@GetMapping("/{chapterId:\\\\d+}")');

const managementEndpoint = `
    @GetMapping("/management")
    public ResponseEntity<List<ChapterSummaryResponse>> getManagementChapters(
            @PathVariable Long storyId
    ) {
        return ResponseEntity.ok(chapterService.getChaptersForManagement(storyId));
    }

    @GetMapping("/{chapterId:\\\\d+}")`;
chapterCtrl = chapterCtrl.replace('@GetMapping("/{chapterId:\\\\d+}")', managementEndpoint);

// Also need to import java.util.List if missing, and ChapterSummaryResponse
if (!chapterCtrl.includes('import com.abora.backend.chapter.dto.ChapterSummaryResponse;')) {
    chapterCtrl = chapterCtrl.replace('import com.abora.backend.chapter.dto.ChapterResponse;', 'import com.abora.backend.chapter.dto.ChapterResponse;\nimport com.abora.backend.chapter.dto.ChapterSummaryResponse;');
}
if (!chapterCtrl.includes('import java.util.List;')) {
    chapterCtrl = chapterCtrl.replace('import org.springframework.web.bind.annotation.*;', 'import org.springframework.web.bind.annotation.*;\nimport java.util.List;');
}
fs.writeFileSync(chapterCtrlPath, chapterCtrl);

const chapterSvcPath = 'D:/abora/backend/src/main/java/com/abora/backend/chapter/ChapterService.java';
let chapterSvc = fs.readFileSync(chapterSvcPath, 'utf8');
const managementMethod = `
    public List<ChapterSummaryResponse> getChaptersForManagement(Long storyId) {
        Long userId = getCurrentUserId();
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        if (!story.getAuthor().getId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to access this story's chapters");
        }
        List<Chapter> chapters = chapterRepository.findByStoryIdOrderByChapterNumberAsc(storyId);
        return chapters.stream()
                .map(this::mapToSummaryResponse)
                .toList();
    }

    public ChapterResponse getChapterForManagement`;
chapterSvc = chapterSvc.replace('public ChapterResponse getChapterForManagement', managementMethod);
fs.writeFileSync(chapterSvcPath, chapterSvc);
console.log('Done!');
