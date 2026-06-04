package com.abora.backend.readinglist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingListRepository extends JpaRepository<ReadingList, Long> {
    
    List<ReadingList> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<ReadingList> findByUserIdAndIsPublicTrueOrderByCreatedAtDesc(Long userId);
    
    @Query("SELECT rl FROM ReadingList rl LEFT JOIN FETCH rl.stories WHERE rl.id = :id")
    Optional<ReadingList> findByIdWithStories(@Param("id") Long id);
}
