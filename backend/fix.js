const fs = require('fs');

const configPath = 'D:/abora/backend/src/main/java/com/abora/backend/config/SecurityConfig.java';
let config = fs.readFileSync(configPath, 'utf8');
if (!config.includes('"/error"')) {
    config = config.replace('"/api/health",', '"/api/health",\n                                "/error",');
    fs.writeFileSync(configPath, config);
    console.log('Fixed SecurityConfig');
}

const filePath = 'D:/abora/backend/src/main/java/com/abora/backend/chapter/ChapterService.java';
let content = fs.readFileSync(filePath, 'utf8');

const correctTop = `package com.abora.backend.chapter;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.chapter.dto.ChapterResponse;
import com.abora.backend.chapter.dto.ChapterSummaryResponse;
import com.abora.backend.chapter.dto.CreateChapterRequest;
import com.abora.backend.chapter.dto.ReadChapterResponse;
import com.abora.backend.chapter.dto.UpdateChapterRequest;
import com.abora.backend.common.exception.BadRequestException;
import com.abora.backend.common.exception.ForbiddenException;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.common.exception.ResourceNotFoundException;
import com.abora.backend.common.exception.UnauthorizedException;
import com.abora.backend.common.utils.ChapterUtil;
import com.abora.backend.story.Story;
import com.abora.backend.story.StoryRepository;
import com.abora.backend.story.StoryVisibility;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChapterService {

    private final ChapterRepository chapterRepository;
    private final StoryRepository storyRepository;

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return user.getId();
        }
        throw new UnauthorizedException("User not authenticated");
    }

    private Story verifyStoryAuthor(Long storyId) {
        Long userId = getCurrentUserId();
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new NotFoundException("Story not found"));
        if (!story.getAuthor().getId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to modify this story");
        }
        return story;
    }

    @Transactional
    public ChapterResponse createChapter(Long storyId, CreateChapterRequest request) {
        Story story = verifyStoryAuthor(storyId);`;

const badPattern = /package com\.abora\.backend\.chapter;[\s\S]*?throw new BadRequestException\("Chapter number already exists for this story"\);/;

content = content.replace(badPattern, correctTop + '\n\n        if (chapterRepository.existsByStoryIdAndChapterNumber(storyId, request.chapterNumber())) {\n            throw new BadRequestException("Chapter number already exists for this story");');

fs.writeFileSync(filePath, content);
console.log('Fixed ChapterService');
