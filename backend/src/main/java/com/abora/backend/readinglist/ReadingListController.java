package com.abora.backend.readinglist;

import com.abora.backend.readinglist.dto.CreateReadingListRequest;
import com.abora.backend.readinglist.dto.ReadingListResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reading-lists")
@RequiredArgsConstructor
public class ReadingListController {

    private final ReadingListService readingListService;

    @PostMapping
    public ResponseEntity<ReadingListResponse> createReadingList(
            @Valid @RequestBody CreateReadingListRequest request
    ) {
        ReadingListResponse response = readingListService.createReadingList(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/stories/{storyId}")
    public ResponseEntity<Void> addStoryToList(
            @PathVariable Long id,
            @PathVariable Long storyId
    ) {
        readingListService.addStoryToList(id, storyId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/stories/{storyId}")
    public ResponseEntity<Void> removeStoryFromList(
            @PathVariable Long id,
            @PathVariable Long storyId
    ) {
        readingListService.removeStoryFromList(id, storyId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<ReadingListResponse>> getReadingListsOfUser(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(readingListService.getReadingListsOfUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReadingListResponse> getReadingListDetail(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(readingListService.getReadingListDetail(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReadingListResponse> updateReadingList(
            @PathVariable Long id,
            @Valid @RequestBody CreateReadingListRequest request
    ) {
        return ResponseEntity.ok(readingListService.updateReadingList(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReadingList(
            @PathVariable Long id
    ) {
        readingListService.deleteReadingList(id);
        return ResponseEntity.ok().build();
    }
}
