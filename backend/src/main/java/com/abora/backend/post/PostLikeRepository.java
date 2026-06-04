package com.abora.backend.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, PostLikeId> {
    
    long countByIdPostId(Long postId);
    
    boolean existsByIdPostIdAndIdUserId(Long postId, Long userId);
    
    Optional<PostLike> findByIdPostIdAndIdUserId(Long postId, Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM PostLike p WHERE p.id.postId = :postId")
    void deleteByPostId(Long postId);
}
