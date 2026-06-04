package com.abora.backend.readinglist;

import com.abora.backend.auth.AuthenticatedUser;
import com.abora.backend.common.exception.ForbiddenException;
import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.readinglist.dto.CreateReadingListRequest;
import com.abora.backend.readinglist.dto.ReadingListResponse;
import com.abora.backend.story.Story;
import com.abora.backend.story.StoryRepository;
import com.abora.backend.story.StoryService;
import com.abora.backend.user.User;
import com.abora.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReadingListService {

    private final ReadingListRepository readingListRepository;
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final StoryService storyService;

    @Transactional
    public ReadingListResponse createReadingList(CreateReadingListRequest request) {
        Long userId = getCurrentUserId();
        User user = userRepository.getReferenceById(userId);

        ReadingList readingList = ReadingList.builder()
                .user(user)
                .name(request.name())
                .isPublic(request.isPublic())
                .build();

        readingList = readingListRepository.save(readingList);
        return mapToResponse(readingList);
    }

    @Transactional
    public void addStoryToList(Long listId, Long storyId) {
        ReadingList readingList = readingListRepository.findById(listId)
                .orElseThrow(() -> new NotFoundException("Reading list not found"));

        if (!readingList.getUser().getId().equals(getCurrentUserId())) {
            throw new ForbiddenException("Not your reading list");
        }

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new NotFoundException("Story not found"));

        readingList.getStories().add(story);
        readingListRepository.save(readingList);
    }

    @Transactional
    public void removeStoryFromList(Long listId, Long storyId) {
        ReadingList readingList = readingListRepository.findById(listId)
                .orElseThrow(() -> new NotFoundException("Reading list not found"));

        if (!readingList.getUser().getId().equals(getCurrentUserId())) {
            throw new ForbiddenException("Not your reading list");
        }

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new NotFoundException("Story not found"));

        readingList.getStories().remove(story);
        readingListRepository.save(readingList);
    }

    @Transactional(readOnly = true)
    public List<ReadingListResponse> getReadingListsOfUser(Long userId) {
        Long currentUserId = getCurrentUserIdOptional();
        boolean isOwner = userId.equals(currentUserId);
        
        List<ReadingList> lists;
        if (isOwner) {
            lists = readingListRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } else {
            lists = readingListRepository.findByUserIdAndIsPublicTrueOrderByCreatedAtDesc(userId);
        }
        
        return lists.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReadingListResponse getReadingListDetail(Long id) {
        ReadingList readingList = readingListRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reading list not found"));

        if (!readingList.isPublic()) {
            Long currentUserId = getCurrentUserIdOptional();
            if (currentUserId == null || !readingList.getUser().getId().equals(currentUserId)) {
                throw new ForbiddenException("Reading list is private");
            }
        }

        return mapToResponse(readingList);
    }

    @Transactional
    public ReadingListResponse updateReadingList(Long id, CreateReadingListRequest request) {
        ReadingList readingList = readingListRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reading list not found"));

        if (!readingList.getUser().getId().equals(getCurrentUserId())) {
            throw new ForbiddenException("Not your reading list");
        }

        readingList.setName(request.name());
        readingList.setPublic(request.isPublic());
        readingList = readingListRepository.save(readingList);
        return mapToResponse(readingList);
    }

    @Transactional
    public void deleteReadingList(Long id) {
        ReadingList readingList = readingListRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reading list not found"));

        if (!readingList.getUser().getId().equals(getCurrentUserId())) {
            throw new ForbiddenException("Not your reading list");
        }

        readingListRepository.delete(readingList);
    }


    private ReadingListResponse mapToResponse(ReadingList readingList) {
        return new ReadingListResponse(
                readingList.getId(),
                readingList.getUser().getId(),
                readingList.getUser().getDisplayName(),
                readingList.getName(),
                readingList.isPublic(),
                readingList.getStories().stream()
                        .map(storyService::mapToResponse)
                        .collect(Collectors.toList()),
                readingList.getCreatedAt(),
                readingList.getUpdatedAt()
        );
    }

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser authUser) {
            return authUser.getId();
        }
        throw new ForbiddenException("User not authenticated");
    }

    private Long getCurrentUserIdOptional() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser authUser) {
            return authUser.getId();
        }
        return null;
    }
}
