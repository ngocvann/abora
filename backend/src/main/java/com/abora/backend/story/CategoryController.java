package com.abora.backend.story;

import com.abora.backend.common.exception.NotFoundException;
import com.abora.backend.common.utils.SlugUtil;
import com.abora.backend.story.dto.CategoryDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        List<CategoryDto> dtos = categoryRepository.findAll().stream()
                .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug(), c.getDescription()))
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<CategoryDto> createCategory(@Valid @RequestBody CategoryDto requestDto) {
        Category category = new Category();
        category.setName(requestDto.name());
        category.setSlug(requestDto.slug() != null && !requestDto.slug().isEmpty() ? requestDto.slug() : SlugUtil.toSlug(requestDto.name()));
        category.setDescription(requestDto.description());
        
        Category saved = categoryRepository.save(category);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new CategoryDto(saved.getId(), saved.getName(), saved.getSlug(), saved.getDescription()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDto> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryDto requestDto
    ) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found"));
        
        category.setName(requestDto.name());
        category.setSlug(requestDto.slug() != null && !requestDto.slug().isEmpty() ? requestDto.slug() : SlugUtil.toSlug(requestDto.name()));
        category.setDescription(requestDto.description());
        
        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(new CategoryDto(saved.getId(), saved.getName(), saved.getSlug(), saved.getDescription()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new NotFoundException("Category not found");
        }
        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
