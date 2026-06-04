package com.abora.backend.story;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {
    boolean existsBySlug(String slug);

    @Query("SELECT DISTINCT s FROM Story s JOIN s.categories c WHERE c.id IN :categoryIds AND s.status = 'PUBLISHED' AND s.visibility = 'PUBLIC'")
    List<Story> findByCategoryIdIn(@Param("categoryIds") List<Long> categoryIds);

    Optional<Story> findBySlug(String slug);
    long countByCreatedAtAfter(Instant date);
    
    @Query("SELECT s FROM Story s WHERE " +
        "LOWER(s.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
        "LOWER(s.slug) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
        "LOWER(s.author.displayName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Story> searchStories(@Param("search") String search, Pageable pageable);
    
    Optional<Story> findBySlugAndVisibility(String slug, StoryVisibility visibility);
    
    @Query("SELECT DISTINCT s FROM Story s JOIN s.chapters c WHERE c.status = 'PUBLISHED' AND s.visibility = 'PUBLIC'")
    Page<Story> findPublicStoriesWithPublishedChapters(Pageable pageable);
    
    List<Story> findByAuthorIdOrderByUpdatedAtDesc(Long authorId);

    @Query(value = "SELECT s.*, " +
            "(s.view_count * 0.1 + s.follow_count * 0.5 + (SELECT COUNT(*) FROM reading_histories rh WHERE rh.story_id = s.id AND rh.updated_at >= :sevenDaysAgo) * 0.4) AS hot_score " +
            "FROM stories s " +
            "WHERE s.status = 'PUBLISHED' AND s.visibility = 'PUBLIC' " +
            "ORDER BY hot_score DESC, s.view_count DESC, s.id DESC",
            nativeQuery = true)
    List<Story> findTrendingStories(@Param("sevenDaysAgo") Instant sevenDaysAgo);

    @Query("SELECT s FROM Story s WHERE s.status = 'PUBLISHED' AND s.visibility = 'PUBLIC' ORDER BY s.viewCount DESC, s.id DESC")
    List<Story> findLeaderboardByViewsAllTime();

    @Query(value = "SELECT s.* FROM stories s " +
            "LEFT JOIN reading_histories rh ON s.id = rh.story_id AND rh.updated_at >= :since " +
            "WHERE s.status = 'PUBLISHED' AND s.visibility = 'PUBLIC' " +
            "GROUP BY s.id " +
            "ORDER BY COUNT(rh.id) DESC, s.view_count DESC, s.id DESC",
            nativeQuery = true)
    List<Story> findLeaderboardByViewsInPeriod(@Param("since") Instant since);

    @Query(value = "SELECT s.* FROM stories s " +
            "LEFT JOIN reading_histories rh ON s.id = rh.story_id AND rh.is_favorite = true " +
            "WHERE s.status = 'PUBLISHED' AND s.visibility = 'PUBLIC' " +
            "GROUP BY s.id " +
            "ORDER BY COUNT(rh.id) DESC, s.view_count DESC, s.id DESC",
            nativeQuery = true)
    List<Story> findLeaderboardByVotes();

    @Query("SELECT DISTINCT s FROM Story s LEFT JOIN s.categories c " +
           "WHERE (LOWER(s.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND s.status = 'PUBLISHED' AND s.visibility = 'PUBLIC'")
    List<Story> searchStoriesByTitleOrCategory(@Param("query") String query);

    @Query(value = "SELECT s.*, " +
            " (SELECT COUNT(*) FROM reading_histories rh WHERE rh.story_id = s.id AND rh.is_favorite = true) AS vote_count " +
            "FROM stories s " +
            "WHERE s.status = 'PUBLISHED' AND s.visibility = 'PUBLIC' " +
            "ORDER BY vote_count DESC, s.view_count DESC, s.id DESC",
            nativeQuery = true)
    List<Story> findTopVotedAndViewedStories();
}
