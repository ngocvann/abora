package com.abora.backend.common.storage;

import com.abora.backend.common.exception.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalStorageServiceImpl implements StorageService {

    private final Path rootLocation = Paths.get("uploads");

    public LocalStorageServiceImpl() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage location", e);
        }
    }

    @Override
    public String store(MultipartFile file, String subDirectory) {
        if (file.isEmpty()) {
            throw new BadRequestException("Failed to store empty file.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }

        String newFilename = UUID.randomUUID().toString() + extension;

        try {
            Path targetLocation = this.rootLocation;
            if (subDirectory != null && !subDirectory.trim().isEmpty()) {
                targetLocation = this.rootLocation.resolve(subDirectory);
                Files.createDirectories(targetLocation);
            }

            Path destinationFile = targetLocation.resolve(Paths.get(newFilename))
                    .normalize().toAbsolutePath();

            if (!destinationFile.getParent().startsWith(this.rootLocation.toAbsolutePath())) {
                throw new BadRequestException("Cannot store file outside current directory.");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            // Return URL like: /api/files/covers/uuid.jpg
            String uriPath = "/api/files";
            if (subDirectory != null && !subDirectory.trim().isEmpty()) {
                uriPath += "/" + subDirectory;
            }
            uriPath += "/" + newFilename;

            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path(uriPath)
                    .toUriString();

        } catch (IOException e) {
            throw new RuntimeException("Failed to store file.", e);
        }
    }
}
