package com.abora.backend.story.dto;

public interface TagLeaderboardProjection {
    Long getId();
    String getName();
    String getSlug();
    Long getStoryCount();
    Long getTotalViews();
}
