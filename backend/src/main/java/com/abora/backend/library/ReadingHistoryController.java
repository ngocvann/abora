package com.abora.backend.library;

import com.abora.backend.library.dto.UpdateHistoryRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.abora.backend.library.dto.LibraryItemDto;
import java.util.List;

@RestController
@RequestMapping("/api/user/reading-history")
@RequiredArgsConstructor
public class ReadingHistoryController {

    private final ReadingHistoryService readingHistoryService;

    @PostMapping
    public ResponseEntity<Void> updateReadingHistory(@Valid @RequestBody UpdateHistoryRequest request) {
        readingHistoryService.updateReadingHistory(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/add")
    public ResponseEntity<Void> addToLibrary(@Valid @RequestBody com.abora.backend.library.dto.AddToLibraryRequest request) {
        readingHistoryService.addToLibrary(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<LibraryItemDto>> getLibraryItems(
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(readingHistoryService.getLibraryItems(status));
    }

    @DeleteMapping("/{storyId}")
    public ResponseEntity<Void> removeFromLibrary(@PathVariable Long storyId) {
        readingHistoryService.removeFromLibrary(storyId);
        return ResponseEntity.ok().build();
    }
}
