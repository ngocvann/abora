package com.abora.backend.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private long totalUsers;
    private long newUsersThisMonth;
    private long totalStories;
    private long newStoriesThisMonth;
    private long pendingReports;
    private long totalComments;
}
