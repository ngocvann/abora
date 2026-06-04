import React from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <button 
        className={styles.pageBtn} 
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
      >
        &laquo; Trước
      </button>
      <span className={styles.pageInfo}>
        Trang {currentPage + 1} / {totalPages}
      </span>
      <button 
        className={styles.pageBtn} 
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Sau &raquo;
      </button>
    </div>
  );
};
