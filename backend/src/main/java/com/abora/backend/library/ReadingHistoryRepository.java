package com.abora.backend.library;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingHistoryRepository extends JpaRepository<ReadingHistory, Long> {
    Optional<ReadingHistory> findByUserIdAndStoryId(Long userId, Long storyId);

    @EntityGraph(attributePaths = {"story", "story.author", "lastReadChapter"})
    List<ReadingHistory> findAllByUserIdOrderByUpdatedAtDesc(Long userId);
    
    @EntityGraph(attributePaths = {"story", "story.author", "lastReadChapter"})
    List<ReadingHistory> findAllByUserIdAndStatusOrderByUpdatedAtDesc(Long userId, ReadingStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT rh FROM ReadingHistory rh WHERE rh.user.id = :userId AND rh.updatedAt >= :since ORDER BY rh.updatedAt DESC")
    List<ReadingHistory> findRecentHistory(@org.springframework.data.repository.query.Param("userId") Long userId, @org.springframework.data.repository.query.Param("since") java.time.Instant since);

    List<ReadingHistory> findAllByStoryId(Long storyId);

}
