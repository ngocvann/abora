package com.abora.backend.library;

import com.abora.backend.chapter.Chapter;
import com.abora.backend.story.Story;
import com.abora.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;

@Entity
@Table(name = "reading_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ReadingStatus status = ReadingStatus.READING;

    @Column(name = "is_favorite", nullable = false)
    @Builder.Default
    private boolean isFavorite = false;

    @Column(name = "in_library", nullable = false)
    @Builder.Default
    private boolean inLibrary = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_read_chapter_id")
    private Chapter lastReadChapter;

    @Column(name = "last_read_position")
    private Integer lastReadPosition;

    @Column(name = "last_read_at")
    private Instant lastReadAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;
}
