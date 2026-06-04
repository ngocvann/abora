package com.abora.backend.story;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findByNameIn(List<String> names);
    Optional<Tag> findByName(String name);

    @org.springframework.data.jpa.repository.Query(value = 
        "SELECT t.id AS id, t.name AS name, t.slug AS slug, COUNT(st.story_id) AS storyCount, COALESCE(SUM(s.view_count), 0) AS totalViews " +
        "FROM tags t " +
        "JOIN story_tags st ON t.id = st.tag_id " +
        "JOIN stories s ON st.story_id = s.id " +
        "WHERE s.status = 'PUBLISHED' AND s.visibility = 'PUBLIC' " +
        "GROUP BY t.id " +
        "ORDER BY storyCount DESC, totalViews DESC", nativeQuery = true)
    List<com.abora.backend.story.dto.TagLeaderboardProjection> findTopTagsLeaderboard();
}
