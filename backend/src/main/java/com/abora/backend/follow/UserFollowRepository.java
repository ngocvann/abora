package com.abora.backend.follow;

import com.abora.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {
    
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);
    
    Optional<UserFollow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);
    
    long countByFollowerId(Long followerId);
    
    long countByFollowingId(Long followingId);
    
    @Query("SELECT uf.follower FROM UserFollow uf WHERE uf.following.id = :followingId ORDER BY uf.createdAt DESC")
    List<User> findFollowersByFollowingId(@Param("followingId") Long followingId);
    
    @Query("SELECT uf.follower.id FROM UserFollow uf WHERE uf.following.id = :followingId")
    List<Long> findFollowerIdsByFollowingId(@Param("followingId") Long followingId);
    
    @Query("SELECT uf.following FROM UserFollow uf WHERE uf.follower.id = :followerId ORDER BY uf.createdAt DESC")
    List<User> findFollowingByFollowerId(@Param("followerId") Long followerId);

    @Query("SELECT CASE WHEN COUNT(uf) > 0 THEN uf.mutedNotifications ELSE false END FROM UserFollow uf WHERE uf.follower.id = :followerId AND uf.following.id = :followingId")
    boolean isMutedNotifications(@Param("followerId") Long followerId, @Param("followingId") Long followingId);
}
