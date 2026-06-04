package com.abora.backend.community;

import java.io.Serializable;
import java.util.Objects;

public class StoryFollowId implements Serializable {
    private Long userId;
    private Long storyId;

    public StoryFollowId() {}

    public StoryFollowId(Long userId, Long storyId) {
        this.userId = userId;
        this.storyId = storyId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getStoryId() {
        return storyId;
    }

    public void setStoryId(Long storyId) {
        this.storyId = storyId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        StoryFollowId that = (StoryFollowId) o;
        return Objects.equals(userId, that.userId) &&
               Objects.equals(storyId, that.storyId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, storyId);
    }
}
