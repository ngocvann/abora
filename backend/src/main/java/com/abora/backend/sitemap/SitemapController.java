package com.abora.backend.sitemap;

import com.abora.backend.chapter.Chapter;
import com.abora.backend.chapter.ChapterRepository;
import com.abora.backend.story.Story;
import com.abora.backend.story.StoryRepository;
import com.abora.backend.story.StoryStatus;
import com.abora.backend.story.StoryVisibility;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class SitemapController {

    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<String> getSitemap() {
        List<Story> stories = storyRepository.findByVisibilityAndStatus(StoryVisibility.PUBLIC, StoryStatus.PUBLISHED);
        List<Chapter> chapters = chapterRepository.findAllPublicPublishedChapters();

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // Static pages
        addUrl(xml, "https://abora.blog/", "daily", "1.0", null);
        addUrl(xml, "https://abora.blog/explore", "daily", "0.9", null);
        addUrl(xml, "https://abora.blog/terms", "monthly", "0.3", null);
        addUrl(xml, "https://abora.blog/privacy", "monthly", "0.3", null);
        addUrl(xml, "https://abora.blog/help", "monthly", "0.3", null);
        addUrl(xml, "https://abora.blog/login", "monthly", "0.5", null);
        addUrl(xml, "https://abora.blog/register", "monthly", "0.5", null);

        // Public stories
        for (Story story : stories) {
            Instant lastModInstant = story.getUpdatedAt() != null ? story.getUpdatedAt() : story.getCreatedAt();
            String lastMod = lastModInstant != null ? lastModInstant.toString().substring(0, 10) : null;
            addUrl(xml, "https://abora.blog/story/" + story.getSlug(), "weekly", "0.8", lastMod);
        }

        // Published chapters
        for (Chapter chapter : chapters) {
            Instant lastModInstant = chapter.getPublishedAt() != null ? chapter.getPublishedAt() :
                                    (chapter.getUpdatedAt() != null ? chapter.getUpdatedAt() : chapter.getCreatedAt());
            String lastMod = lastModInstant != null ? lastModInstant.toString().substring(0, 10) : null;
            addUrl(xml, "https://abora.blog/story/" + chapter.getStory().getSlug() + "/chapter/" + chapter.getSlug(), "monthly", "0.7", lastMod);
        }

        xml.append("</urlset>");
        return ResponseEntity.ok(xml.toString());
    }

    private void addUrl(StringBuilder xml, String loc, String changeFreq, String priority, String lastMod) {
        xml.append("  <url>\n");
        xml.append("    <loc>").append(loc).append("</loc>\n");
        if (lastMod != null) {
            xml.append("    <lastmod>").append(lastMod).append("</lastmod>\n");
        }
        xml.append("    <changefreq>").append(changeFreq).append("</changefreq>\n");
        xml.append("    <priority>").append(priority).append("</priority>\n");
        xml.append("  </url>\n");
    }
}
