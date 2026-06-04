package com.abora.backend;

import com.abora.backend.chapter.Chapter;
import com.abora.backend.chapter.ChapterRepository;
import com.abora.backend.common.utils.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class SlugMigrationRunner implements CommandLineRunner {

    private final ChapterRepository chapterRepository;

    @Override
    public void run(String... args) throws Exception {
        List<Chapter> chapters = chapterRepository.findAll();
        for (Chapter chapter : chapters) {
            if (chapter.getSlug() == null || chapter.getSlug().isEmpty()) {
                String baseSlug = SlugUtil.toSlug(chapter.getTitle());
                if (baseSlug == null || baseSlug.isEmpty()) {
                    baseSlug = "chuong";
                }
                String slug = baseSlug;
                int counter = 1;
                while (true) {
                    boolean exists = chapterRepository.existsByStoryIdAndSlugAndIdNot(chapter.getStory().getId(), slug, chapter.getId());
                    if (!exists) break;
                    slug = baseSlug + "-" + counter;
                    counter++;
                }
                chapter.setSlug(slug);
                chapterRepository.save(chapter);
            }
        }
    }
}
