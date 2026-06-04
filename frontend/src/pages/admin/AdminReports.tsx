import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './AdminUsers.module.css'; // using same styles
import { Pagination } from '../../components/common/Pagination';
import { ReportActionModal } from './ReportActionModal';
import { Search } from 'lucide-react';

interface AdminReport {
  id: number;
  reporterId: number;
  reporterUsername: string;
  targetType: 'STORY' | 'COMMENT' | 'USER';
  targetId: number;
  reason: string;
  status: string;
  moderatorNote: string | null;
  createdAt: string;
  targetName?: string;
  targetUrl?: string;
  isTargetDeleted?: boolean;
}

type TabType = 'ALL' | 'STORY' | 'COMMENT' | 'USER';

export const AdminReports: React.FC = () => {
  const truncateStyle: React.CSSProperties = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordBreak: 'break-word'
  };

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = activeTab === 'ALL' ? '' : `&targetType=${activeTab}`;
      const res = await api.get(`/admin/reports?size=8&page=${page}&search=${encodeURIComponent(search)}${typeParam}`);
      setReports(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeTab]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchReports();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(0);
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'PENDING': return styles.statusSuspended; // Warning color
      case 'RESOLVED': return styles.statusActive; // Success color
      case 'REJECTED': return styles.statusBanned; // Danger color
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className="text-gradient">Quản lý Báo cáo</h2>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input 
            type="search" 
            placeholder="Tìm theo lý do..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn} title="Tìm kiếm">
            <Search size={18} />
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {(['ALL', 'STORY', 'COMMENT', 'USER'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              background: activeTab === tab ? 'var(--primary-color)' : 'var(--glass-bg)',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            {tab === 'ALL' ? 'Tất cả' : tab === 'STORY' ? 'Truyện' : tab === 'COMMENT' ? 'Bình luận' : 'Người dùng'}
          </button>
        ))}
      </div>
      
      <div className={`glass-panel ${styles.tableContainer}`}>
        <table className={styles.table} style={{ tableLayout: 'fixed', wordBreak: 'break-word' }}>
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Người báo cáo</th>
              <th style={{ width: '25%' }}>Đối tượng</th>
              <th style={{ width: '25%' }}>Lý do</th>
              <th style={{ width: '12%' }}>Trạng thái</th>
              <th style={{ width: '12%' }}>Ngày tạo</th>
              <th style={{ width: '11%' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign:'center'}}>Đang tải...</td></tr>
            ) : reports.map(report => (
              <tr key={report.id}>
                <td>
                  <div style={truncateStyle}>
                    {report.reporterUsername ? (
                      <Link to={`/${report.reporterUsername}`} target="_blank" rel="noreferrer" style={{color: 'var(--primary-color)', textDecoration: 'none'}}>
                        @{report.reporterUsername}
                      </Link>
                    ) : (
                      <span style={{color: 'var(--text-secondary)'}}>Người dùng #{report.reporterId}</span>
                    )}
                  </div>
                </td>
                <td>
                  <div style={truncateStyle}>
                    {report.isTargetDeleted ? (
                       <span style={{color: 'var(--text-secondary)'}}>
                         <span style={{fontWeight: 600}}>{report.targetType}: </span>
                         {report.targetName || `#${report.targetId}`} (Đã xóa)
                       </span>
                    ) : report.targetUrl ? (
                      <Link to={report.targetUrl} target="_blank" rel="noreferrer" style={{color: 'var(--primary-color)', textDecoration: 'none'}}>
                        <span style={{fontWeight: 600}}>{report.targetType}: </span>
                        {report.targetName || `#${report.targetId}`}
                      </Link>
                    ) : (
                      <>
                        <span style={{fontWeight: 600}}>{report.targetType}</span> 
                        <span style={{color: 'var(--text-secondary)'}}> {report.targetName || `#${report.targetId}`}</span>
                      </>
                    )}
                  </div>
                </td>
                <td>
                  <div style={truncateStyle} title={report.reason}>
                    {report.reason}
                  </div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${getStatusClass(report.status)}`}>
                    {report.status}
                  </span>
                </td>
                <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                <td>
                  {report.status === 'PENDING' ? (
                    <button 
                      className={`${styles.actionBtn} ${styles.success}`}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={() => setSelectedReport(report)}
                    >
                      Xử lý
                    </button>
                  ) : (
                    <span style={{color: 'var(--text-secondary)'}}>Đã xử lý</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && reports.length === 0 && (
              <tr><td colSpan={6} style={{textAlign:'center'}}>Không có báo cáo nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {selectedReport && (
        <ReportActionModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)}
          onSuccess={() => {
            setSelectedReport(null);
            fetchReports();
          }}
        />
      )}
    </div>
  );
};

