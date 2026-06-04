import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import styles from './AdminUsers.module.css';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

import { Search } from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role: string;
  status: string;
  createdAt: string;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    currentStatus: string;
    newStatus: string;
  }>({
    isOpen: false,
    userId: null,
    currentStatus: '',
    newStatus: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?size=8&page=${page}&search=${encodeURIComponent(search)}`);
      setUsers(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const openConfirmModal = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED';
    setConfirmModal({
      isOpen: true,
      userId: id,
      currentStatus,
      newStatus,
    });
  };

  const handleUpdateStatus = async () => {
    const { userId, newStatus } = confirmModal;
    if (!userId) return;

    try {
      await api.put(`/admin/users/${userId}/status?status=${newStatus}`);
      toast.success(`Đã chuyển trạng thái thành ${newStatus}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('Cập nhật thất bại');
    } finally {
      setConfirmModal({ isOpen: false, userId: null, currentStatus: '', newStatus: '' });
    }
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'ACTIVE': return styles.statusActive;
      case 'SUSPENDED': return styles.statusSuspended;
      case 'BANNED': return styles.statusBanned;
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className="text-gradient">Quản lý người dùng</h2>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input 
            type="search" 
            placeholder="Tìm theo email, username..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn} title="Tìm kiếm">
            <Search size={18} />
          </button>
        </form>
      </div>
      
      <div className={`glass-panel ${styles.tableContainer}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tham gia</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign:'center'}}>Đang tải...</td></tr>
            ) : users.map(user => (
              <tr key={user.id}>
                <td>
                  <Link to={`/${user.username}`} style={{textDecoration: 'none', color: 'inherit'}}>
                    <div className={styles.userInfo} style={{cursor: 'pointer'}}>
                      <img 
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                        alt={user.username} 
                        className={styles.avatar} 
                      />
                      <div>
                        <div style={{fontWeight: 600, color: 'var(--text-primary)'}}>{user.displayName}</div>
                        <div style={{fontSize: '0.85rem', color: 'var(--primary-color)'}}>@{user.username}</div>
                      </div>
                    </div>
                  </Link>
                </td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`${styles.statusBadge} ${getStatusClass(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button 
                    className={`${styles.actionBtn} ${user.status === 'BANNED' ? styles.success : styles.danger}`}
                    onClick={() => openConfirmModal(user.id, user.status)}
                  >
                    {user.status === 'BANNED' ? 'Active' : 'Ban'}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={6} style={{textAlign:'center'}}>Không có người dùng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
      />

      {/* Modern Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Xác nhận thay đổi trạng thái"
        message={`Bạn có chắc muốn chuyển trạng thái người dùng này thành ${confirmModal.newStatus}?`}
        confirmText="Đồng ý"
        cancelText="Hủy"
        isDanger={confirmModal.newStatus === 'BANNED'}
        onConfirm={handleUpdateStatus}
        onCancel={() => setConfirmModal({ isOpen: false, userId: null, currentStatus: '', newStatus: '' })}
      />
    </div>
  );
};
