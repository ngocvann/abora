package com.abora.backend.chapter;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface ChapterViewRepository extends JpaRepository<ChapterView, Long> {

    @Query("SELECT COUNT(cv) > 0 FROM ChapterView cv WHERE cv.chapterId = :chapterId " +
           "AND cv.userId = :userId AND cv.viewedAt > :since")
    boolean existsByChapterIdAndUserIdAndViewedAtAfter(
            @Param("chapterId") Long chapterId,
            @Param("userId") Long userId,
            @Param("since") Instant since
    );

    @Query("SELECT COUNT(cv) > 0 FROM ChapterView cv WHERE cv.chapterId = :chapterId " +
           "AND cv.ipAddress = :ipAddress AND cv.viewedAt > :since")
    boolean existsByChapterIdAndIpAddressAndViewedAtAfter(
            @Param("chapterId") Long chapterId,
            @Param("ipAddress") String ipAddress,
            @Param("since") Instant since
    );
}
