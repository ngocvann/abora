package com.abora.backend.community;

import com.abora.backend.moderation.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.abora.backend.moderation.ReportStatus;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    long countByStatus(ReportStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Report r WHERE LOWER(r.reason) LIKE LOWER(CONCAT('%', :search, '%'))")
    org.springframework.data.domain.Page<Report> searchReports(@org.springframework.data.repository.query.Param("search") String search, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Report r WHERE LOWER(r.reason) LIKE LOWER(CONCAT('%', :search, '%')) AND r.targetType = :targetType")
    org.springframework.data.domain.Page<Report> searchReportsByType(@org.springframework.data.repository.query.Param("search") String search, @org.springframework.data.repository.query.Param("targetType") com.abora.backend.moderation.ReportTargetType targetType, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Report> findByTargetType(com.abora.backend.moderation.ReportTargetType targetType, org.springframework.data.domain.Pageable pageable);
}
