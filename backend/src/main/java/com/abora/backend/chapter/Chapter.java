package com.abora.backend.chapter;

import com.abora.backend.story.Story;
import jakarta.persistence.*;
import org.hibernate.annotations.Where;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;

@Entity
@Where(clause = "is_deleted = false")
@Table(name = "chapters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 255)
    private String slug;

    @Column(name = "chapter_number", nullable = false)
    private Integer chapterNumber;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ChapterStatus status = ChapterStatus.DRAFT;

    @Column(name = "word_count", nullable = false)
    @Builder.Default
    private Integer wordCount = 0;

    @Column(name = "estimated_reading_time", nullable = false)
    @Builder.Default
    private Integer estimatedReadingTime = 0;

    @Column(name = "view_count", columnDefinition = "bigint default 0")
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "like_count", columnDefinition = "integer default 0")
    @Builder.Default
    private Integer likeCount = 0;

    @Column(name = "comment_count", columnDefinition = "integer default 0")
    @Builder.Default
    private Integer commentCount = 0;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
}
