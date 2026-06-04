package com.abora.backend.common.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    /**
     * Stores the file and returns the URL to access it.
     */
    String store(MultipartFile file, String subDirectory);
}
