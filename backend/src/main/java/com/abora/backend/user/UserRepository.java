package com.abora.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
        "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
        "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
        "LOWER(u.displayName) LIKE LOWER(CONCAT('%', :search, '%'))")
    org.springframework.data.domain.Page<User> searchUsers(@org.springframework.data.repository.query.Param("search") String search, org.springframework.data.domain.Pageable pageable);

    /** Tìm user OAuth2 theo provider + providerId */
    Optional<User> findByOauthProviderAndOauthProviderId(String oauthProvider, String oauthProviderId);

    long countByCreatedAtAfter(java.time.Instant date);

    @org.springframework.data.jpa.repository.Query("SELECT u.id FROM User u")
    List<Long> findAllIds();

    @org.springframework.data.jpa.repository.Query(value =
        "SELECT u.id AS id, u.username AS username, u.display_name AS displayName, u.avatar_url AS avatarUrl, " +
        "  (SELECT COUNT(*) FROM user_follows uf WHERE uf.following_id = u.id) AS followerCount, " +
        "  (SELECT COUNT(*) FROM reading_histories rh JOIN stories s ON rh.story_id = s.id WHERE s.author_id = u.id AND rh.is_favorite = true) AS totalVotes, " +
        "  ((SELECT COUNT(*) FROM user_follows uf WHERE uf.following_id = u.id) + " +
        "   (SELECT COUNT(*) FROM reading_histories rh JOIN stories s ON rh.story_id = s.id WHERE s.author_id = u.id AND rh.is_favorite = true)) AS score " +
        "FROM users u " +
        "ORDER BY score DESC, followerCount DESC, u.id DESC", nativeQuery = true)
    List<com.abora.backend.story.dto.AuthorLeaderboardProjection> findTopAuthorsLeaderboard();
}