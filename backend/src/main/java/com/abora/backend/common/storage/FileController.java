package com.abora.backend.common.storage;

import com.abora.backend.common.exception.NotFoundException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final Path rootLocation = Paths.get("uploads");

    @GetMapping("/{subDirectory}/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String subDirectory, @PathVariable String filename) {
        try {
            Path file = rootLocation.resolve(subDirectory).resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new NotFoundException("Could not read file: " + filename);
            }
        } catch (MalformedURLException e) {
            throw new NotFoundException("Could not read file: " + filename);
        }
    }
    
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveRootFile(@PathVariable String filename) {
        try {
            Path file = rootLocation.resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new NotFoundException("Could not read file: " + filename);
            }
        } catch (MalformedURLException e) {
            throw new NotFoundException("Could not read file: " + filename);
        }
    }
}
