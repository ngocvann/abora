package com.abora.backend.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoryFollowRepository extends JpaRepository<StoryFollow, StoryFollowId> {
    boolean existsByUserIdAndStoryId(Long userId, Long storyId);
    void deleteByUserIdAndStoryId(Long userId, Long storyId);
}
