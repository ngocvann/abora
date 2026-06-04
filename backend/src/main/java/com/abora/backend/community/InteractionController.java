package com.abora.backend.community;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stories/{storyId:\\d+}")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;

    @PostMapping("/favorite")
    public ResponseEntity<Void> addFavorite(@PathVariable Long storyId) {
        interactionService.toggleFavorite(storyId, true);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/favorite")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long storyId) {
        interactionService.toggleFavorite(storyId, false);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/follow")
    public ResponseEntity<Boolean> getFollowStatus(@PathVariable Long storyId) {
        return ResponseEntity.ok(interactionService.checkFollowStatus(storyId));
    }

    @PostMapping("/follow")
    public ResponseEntity<Void> addFollow(@PathVariable Long storyId) {
        interactionService.toggleFollow(storyId, true);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/follow")
    public ResponseEntity<Void> removeFollow(@PathVariable Long storyId) {
        interactionService.toggleFollow(storyId, false);
        return ResponseEntity.ok().build();
    }
}
