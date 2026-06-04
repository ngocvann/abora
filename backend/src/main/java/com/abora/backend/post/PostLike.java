package com.abora.backend.post;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "post_likes")
@Getter
@Setter
@NoArgsConstructor
public class PostLike {

    @EmbeddedId
    private PostLikeId id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PostLike(Long postId, Long userId) {
        this.id = new PostLikeId(postId, userId);
        this.createdAt = Instant.now();
    }
}
