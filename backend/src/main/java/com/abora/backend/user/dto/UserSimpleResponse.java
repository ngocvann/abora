package com.abora.backend.user.dto;

public record UserSimpleResponse(
    Long id,
    String username,
    String displayName,
    String avatarUrl
) {
    public static UserSimpleResponse fromUser(com.abora.backend.user.User user) {
        return new UserSimpleResponse(
            user.getId(),
            user.getUsername(),
            user.getDisplayName(),
            user.getAvatarUrl()
        );
    }
}
