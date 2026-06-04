package com.abora.backend.chapter;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChapterLikeRepository extends JpaRepository<ChapterLike, Long> {
    boolean existsByUserIdAndChapterId(Long userId, Long chapterId);
    Optional<ChapterLike> findByUserIdAndChapterId(Long userId, Long chapterId);
    void deleteByUserIdAndChapterId(Long userId, Long chapterId);
}
