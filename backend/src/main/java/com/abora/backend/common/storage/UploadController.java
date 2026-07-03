package com.abora.backend.common.storage;

import com.abora.backend.auth.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final StorageService storageService;

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        String contentType = file.getContentType();
        String mediaType = (contentType != null && contentType.startsWith("video")) ? "VIDEO" : "IMAGE";
        String url = storageService.store(file, "posts");
        return ResponseEntity.ok(Map.of("url", url, "mediaType", mediaType));
    }
}
