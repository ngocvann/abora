package com.abora.backend.chapter;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    List<Chapter> findByStoryIdOrderByChapterNumberAsc(Long storyId);
    boolean existsByStoryIdAndChapterNumber(Long storyId, Integer chapterNumber);
    boolean existsByStoryIdAndSlug(Long storyId, String slug);
    boolean existsByStoryIdAndSlugAndIdNot(Long storyId, String slug, Long id);
    
    List<Chapter> findByStoryIdAndStatusOrderByChapterNumberAsc(Long storyId, ChapterStatus status);
    
    Optional<Chapter> findByStoryIdAndChapterNumberAndStatus(Long storyId, Integer chapterNumber, ChapterStatus status);
    
    Optional<Chapter> findByStoryIdAndSlugAndStatus(Long storyId, String slug, ChapterStatus status);
    
    Optional<Chapter> findTopByStoryIdAndChapterNumberGreaterThanAndStatusOrderByChapterNumberAsc(Long storyId, Integer chapterNumber, ChapterStatus status);
    
    Optional<Chapter> findTopByStoryIdAndChapterNumberLessThanAndStatusOrderByChapterNumberDesc(Long storyId, Integer chapterNumber, ChapterStatus status);
    
    Optional<Chapter> findFirstByStoryIdAndStatusOrderByChapterNumberDesc(Long storyId, ChapterStatus status);
    
    long countByStoryIdAndStatus(Long storyId, ChapterStatus status);

    @Query("SELECT c FROM Chapter c WHERE c.status = 'PUBLISHED' AND c.story.visibility = 'PUBLIC' AND c.story.status = 'PUBLISHED'")
    List<Chapter> findAllPublicPublishedChapters();
}
