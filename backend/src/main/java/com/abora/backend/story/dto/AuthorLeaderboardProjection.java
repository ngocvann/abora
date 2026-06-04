package com.abora.backend.story.dto;

public interface AuthorLeaderboardProjection {
    Long getId();
    String getUsername();
    String getDisplayName();
    String getAvatarUrl();
    Long getFollowerCount();
    Long getTotalVotes();
    Long getScore();
}
