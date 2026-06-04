import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import styles from './AdminUsers.module.css'; // using same styles
import { Pagination } from '../../components/common/Pagination';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Search } from 'lucide-react';

interface AdminStory {
  id: number;
  title: string;
  slug: string;
  authorName: string;
  authorUsername: string;
  authorId: number;
  status: string;
  visibility: string;
  viewCount: number;
  createdAt: string;
}

export const AdminStories: React.FC = () => {
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    storyId: number | null;
    currentStatus: string;
    newStatus: string;
    actionType: 'STATUS' | 'DELETE';
  }>({
    isOpen: false,
    storyId: null,
    currentStatus: '',
    newStatus: '',
    actionType: 'STATUS'
  });

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/stories?size=8&page=${page}&search=${encodeURIComponent(search)}`);
      setStories(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách truyện');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchStories();
  };

  const openConfirmModal = (id: number, currentStatus: string, actionType: 'STATUS' | 'DELETE' = 'STATUS') => {
    const newStatus = currentStatus === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN';
    setConfirmModal({
      isOpen: true,
      storyId: id,
      currentStatus,
      newStatus,
      actionType
    });
  };

  const handleUpdateStatus = async () => {
    const { storyId, newStatus, actionType } = confirmModal;
    if (!storyId) return;

    try {
      if (actionType === 'STATUS') {
        await api.put(`/admin/stories/${storyId}/status?status=${newStatus}`);
        toast.success(`Đã chuyển trạng thái thành ${newStatus}`);
      } else if (actionType === 'DELETE') {
        await api.delete(`/admin/stories/${storyId}`);
        toast.success('Đã xóa truyện thành công');
      }
      fetchStories();
    } catch (err) {
      console.error(err);
      toast.error('Cập nhật thất bại');
    } finally {
      setConfirmModal({ isOpen: false, storyId: null, currentStatus: '', newStatus: '', actionType: 'STATUS' });
    }
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'PUBLISHED': return styles.statusActive;
      case 'DRAFT': return styles.statusSuspended;
      case 'HIDDEN': return styles.statusBanned;
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className="text-gradient">Quản lý Truyện</h2>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input 
            type="search" 
            placeholder="Tìm theo tiêu đề, slug..." 
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
              <th>Truyện</th>
              <th>Tác giả</th>
              <th>Trạng thái</th>
              <th>Lượt xem</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign:'center'}}>Đang tải...</td></tr>
            ) : stories.map(story => (
              <tr key={story.id}>
                <td><Link to={`/story/${story.id}-${story.slug}`} style={{color: 'var(--text-primary)', textDecoration: 'none'}}>{story.title}</Link></td>
                <td>
                  <Link to={`/${story.authorUsername}`} style={{color: 'var(--primary-color)', textDecoration: 'none'}}>
                    {story.authorName} (@{story.authorUsername})
                  </Link>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${getStatusClass(story.status)}`}>
                    {story.status}
                  </span>
                </td>
                <td>{story.viewCount}</td>
                <td>{new Date(story.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className={`${styles.actionBtn} ${story.status === 'HIDDEN' ? styles.success : styles.danger}`}
                      onClick={() => openConfirmModal(story.id, story.status, 'STATUS')}
                    >
                      {story.status === 'HIDDEN' ? 'Show' : 'Hide'}
                    </button>
                    <button 
                      className={`${styles.actionBtn} ${styles.danger}`}
                      onClick={() => openConfirmModal(story.id, story.status, 'DELETE')}
                      style={{ background: '#ef4444' }}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && stories.length === 0 && (
              <tr><td colSpan={6} style={{textAlign:'center'}}>Không có truyện nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Modern Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.actionType === 'DELETE' ? "Xác nhận xóa truyện" : "Xác nhận thay đổi trạng thái"}
        message={confirmModal.actionType === 'DELETE' ? "Bạn có chắc chắn muốn xóa vĩnh viễn truyện này? Hành động này không thể hoàn tác." : `Bạn có chắc muốn chuyển trạng thái truyện này thành ${confirmModal.newStatus}?`}
        confirmText="Đồng ý"
        cancelText="Hủy"
        isDanger={confirmModal.actionType === 'DELETE' || confirmModal.newStatus === 'HIDDEN'}
        onConfirm={handleUpdateStatus}
        onCancel={() => setConfirmModal({ isOpen: false, storyId: null, currentStatus: '', newStatus: '', actionType: 'STATUS' })}
      />
    </div>
  );
};
