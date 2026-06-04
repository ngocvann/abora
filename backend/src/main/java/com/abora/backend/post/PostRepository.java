package com.abora.backend.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    org.springframework.data.domain.Page<Post> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);


    
    Page<Post> findByTypeOrderByCreatedAtDesc(PostType type, Pageable pageable);
    
    List<Post> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, PostType type);
    
    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
}
