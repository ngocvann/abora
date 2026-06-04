const fs = require('fs');
const filePath = 'D:/abora/backend/src/main/java/com/abora/backend/chapter/ChapterService.java';
let content = fs.readFileSync(filePath, 'utf8');

const missingUpdate = `    @Transactional
    public ChapterResponse updateChapter(Long storyId, Long chapterId, UpdateChapterRequest request) {
        verifyStoryAuthor(storyId);
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new NotFoundException("Chapter not found"));
        if (!chapter.getStory().getId().equals(storyId)) {
            throw new BadRequestException("Chapter does not belong to this story");
        }
        
        if (request.title() != null) chapter.setTitle(request.title());
        if (request.content() != null) {
            chapter.setContent(request.content());
            int wordCount = ChapterUtil.calculateWordCount(request.content());
            chapter.setWordCount(wordCount);
            chapter.setEstimatedReadingTime(ChapterUtil.calculateEstimatedReadingTime(wordCount));
        }
        if (request.status() != null) {
            ChapterStatus status = ChapterStatus.valueOf(request.status().toUpperCase());
            if (status == ChapterStatus.PUBLISHED && chapter.getStatus() != ChapterStatus.PUBLISHED && chapter.getPublishedAt() == null) {
                chapter.setPublishedAt(Instant.now());
            }
            chapter.setStatus(status);
        }
        
        chapter = chapterRepository.save(chapter);
        return mapToResponse(chapter);
    }`;

if (!content.includes('public ChapterResponse updateChapter')) {
    content = content.replace('public ChapterResponse getChapterForManagement', missingUpdate + '\n\n    public ChapterResponse getChapterForManagement');
    fs.writeFileSync(filePath, content);
    console.log('Added updateChapter');
}
