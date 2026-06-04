package com.abora.backend.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    
    long countByPostId(Long postId);
    
    List<PostComment> findByPostIdOrderByCreatedAtAsc(Long postId);
    
    List<PostComment> findByPostIdAndParentIsNullOrderByCreatedAtAsc(Long postId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM PostComment p WHERE p.post.id = :postId")
    void deleteByPostId(Long postId);
}
