import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import type { Story } from "../../types/story";
import { Button } from "../../components/ui/Button";
import { PlusCircle, BookOpen, Menu, Eye, Heart, MessageCircle, BarChart2, Share2, MoreHorizontal, ChevronRight, Copy, Check, Trash2, PowerOff, X } from "lucide-react";
import toast from "react-hot-toast";
import { AnalyticsModal } from "./AnalyticsModal";
import { getImageUrl } from "../../utils/image";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import "./Studio.css";

const fetchManagementStories = async (): Promise<Story[]> => {
  const { data } = await api.get("/stories/management");
  return data;
};

const formatStoryDate = (dateString?: string) => {
  if (!dateString) return 'Đã cập nhật gần đây';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Đã cập nhật gần đây';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hoursStr = String(hours).padStart(2, '0');
  
  return `Đã cập nhật Th${month} ${day}, ${year} ${hoursStr}:${minutes}${ampm}`;
};

const renderChapterStatusLine = (story: Story) => {
  const published = story.publishedChapterCount ?? 0;
  const draft = story.draftChapterCount ?? 0;
  
  if (published > 0 && draft > 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span className="story-row-status">
          {published} Chương đã đăng
        </span>
        <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>-</span>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
          {draft} Bản thảo
        </span>
      </div>
    );
  } else if (draft > 0 && published === 0) {
    return (
      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
        {draft} Bản thảo
      </span>
    );
  } else {
    return (
      <span className="story-row-status">
        {published} Chương đã đăng
      </span>
    );
  }
};

export const StudioDashboard: React.FC = () => {
  useDocumentTitle("Studio Sáng Tác - Abora");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStoryForAnalytics, setSelectedStoryForAnalytics] = useState<Story | null>(null);

  const [shareStory, setShareStory] = useState<Story | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: stories, isLoading } = useQuery({
    queryKey: ["management-stories"],
    queryFn: fetchManagementStories,
  });

  const updateStoryStatusMutation = useMutation({
    mutationFn: async ({ story, status }: { story: Story; status: string }) => {
      const payload = {
        title: story.title,
        description: story.description,
        categoryIds: story.categories?.map(c => c.id) || [],
        tags: story.tags?.map(t => t.name) || [],
        contentWarning: story.contentWarning,
        ageRating: story.ageRating,
        status: status,
        visibility: story.visibility
      };
      const { data } = await api.put(`/stories/${story.id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["management-stories"] });
      toast.success("Cập nhật trạng thái thành công");
      setActiveDropdown(null);
    },
    onError: () => toast.error("Cập nhật trạng thái thất bại"),
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/stories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["management-stories"] });
      toast.success("Đã xóa truyện thành công");
      setActiveDropdown(null);
    },
    onError: () => toast.error("Xóa truyện thất bại"),
  });

  return (
    <div className="studio-container fade-in">
      <div className="studio-header">
        <h1 className="studio-title">
          Studio<span className="desktop-suffix"> Sáng Tác</span>
        </h1>
        <Button onClick={() => navigate("/studio/story/new")} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={18} /> Tạo <span className="desktop-suffix">truyện </span>mới
        </Button>
      </div>

      <div className="studio-tabs">
        <button 
          className={`studio-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Tất cả truyện
        </button>
        <button 
          className={`studio-tab ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          Đã đăng tải
        </button>
        <button 
          className={`studio-tab ${activeTab === 'series' ? 'active' : ''}`}
          onClick={() => setActiveTab('series')}
        >
          Series
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <span className="spinner"></span>
        </div>
      ) : activeTab === 'series' ? (
        <div className="text-center p-12 glass-panel rounded-xl">
          <p className="text-secondary">Tính năng Series đang được phát triển.</p>
        </div>
      ) : stories?.length === 0 ? (
        <div className="text-center p-12 glass-panel rounded-xl">
          <BookOpen
            size={48}
            className="mx-auto text-secondary opacity-50"
            style={{ marginTop: '1rem', marginBottom: '0.25rem' }}
          />
          <h2 className="text-xl font-semibold" style={{ marginBottom: '0.25rem' }}>Chưa có tác phẩm nào</h2>
          <p className="text-secondary" style={{ marginBottom: '0.5rem' }}>
            Hãy bắt đầu hành trình sáng tác của bạn ngay hôm nay.
          </p>
          <Button onClick={() => navigate("/studio/story/new")} style={{ marginBottom: '1rem' }}>
            Bắt đầu viết
          </Button>
        </div>
      ) : (
        <div className="story-list">
          {stories?.filter(s => activeTab === 'all' || (activeTab === 'published' && (s.publishedChapterCount ?? 0) > 0)).map((story) => (
            <div key={story.id} className="story-row">
              <div className="story-row-drag-handle">
                <Menu size={20} />
              </div>
              
              <Link to={`/studio/story/${story.id}/chapters`} className="flex-shrink-0">
                <img
                  src={getImageUrl(story.coverImageUrl, 'cover', story.title)}
                  alt={story.title}
                  className="story-row-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getImageUrl('', 'cover', story.title);
                  }}
                />
              </Link>
              
              <div className="story-row-info">
                <Link to={`/studio/story/${story.id}/chapters`} className="story-row-title">
                  {story.title}
                </Link>
                
                <div style={{ marginBottom: '0.35rem' }}>
                  {renderChapterStatusLine(story)}
                </div>
                
                <div className="story-row-date" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {formatStoryDate(story.updatedAt)}
                </div>
                
                <div className="story-row-stats">
                  <div className="story-row-stat-item" title="Lượt xem">
                    <Eye size={14} /> {story.viewCount || 0}
                  </div>
                  <div className="story-row-stat-item" title="Lượt thích">
                    <Heart size={14} /> {story.favoriteCount || 0}
                  </div>
                  <div className="story-row-stat-item" title="Bình luận">
                    <MessageCircle size={14} /> {story.commentCount || 0}
                  </div>
                </div>
              </div>

              <div className="story-row-actions">
                <button 
                  className="action-btn-primary"
                  onClick={() => navigate(`/studio/story/${story.id}/chapters`)}
                >
                  Tiếp tục viết <ChevronRight size={16} />
                </button>
                <button 
                  className="action-btn-icon" 
                  title="Thống kê"
                  onClick={() => setSelectedStoryForAnalytics(story)}
                >
                  <BarChart2 size={18} />
                </button>
                <button 
                  className="action-btn-icon" 
                  title="Chia sẻ"
                  onClick={() => setShareStory(story)}
                >
                  <Share2 size={18} />
                </button>
                <div style={{ position: 'relative' }}>
                  <button 
                    className="action-btn-icon" 
                    title="Thêm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === story.id ? null : story.id);
                    }}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {activeDropdown === story.id && (
                    <div 
                      ref={dropdownRef}
                      className="fade-in-fast"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        backgroundColor: '#1e1e2d',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        minWidth: '180px',
                        zIndex: 100,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      <Link 
                        to={`/story/${story.id}-${story.slug}`} 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', color: 'var(--text-main)', textDecoration: 'none', borderRadius: '4px', fontSize: '0.9rem' }}
                        className="hover:bg-white/5"
                        onClick={() => setActiveDropdown(null)}
                      >
                        <Eye size={16} /> Xem trước
                      </Link>
                      
                      {(story.publishedChapterCount ?? 0) > 0 && (
                        <button
                          style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', color: 'var(--text-main)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '0.9rem' }}
                          className="hover:bg-white/5 text-left"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: "Xác nhận ẩn truyện",
                              message: "Bạn có chắc chắn muốn dừng đăng tải truyện này không? Tất cả các chương đã đăng sẽ trở thành bản thảo.",
                              onConfirm: () => updateStoryStatusMutation.mutate({ story, status: 'DRAFT' })
                            });
                          }}
                        >
                          <PowerOff size={16} /> Ẩn truyện
                        </button>
                      )}

                      <button
                        style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '0.9rem' }}
                        className="hover:bg-white/5 text-left"
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: "Xóa truyện vĩnh viễn",
                            message: "Bạn có chắc chắn muốn XÓA VĨNH VIỄN truyện này không? Hành động này không thể hoàn tác.",
                            onConfirm: () => deleteStoryMutation.mutate(story.id)
                          });
                        }}
                      >
                        <Trash2 size={16} /> Xóa truyện
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedStoryForAnalytics && (
        <AnalyticsModal 
          story={selectedStoryForAnalytics} 
          onClose={() => setSelectedStoryForAnalytics(null)} 
        />
      )}

      {shareStory && createPortal(
        <div className="analytics-modal-overlay" onClick={() => { setShareStory(null); setCopied(false); }}>
          <div className="analytics-modal-content fade-in-fast" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="analytics-modal-header">
              <h2>Chia sẻ truyện</h2>
              <button className="analytics-close-btn" onClick={() => { setShareStory(null); setCopied(false); }}>
                <X size={24} />
              </button>
            </div>
            <div className="analytics-modal-body" style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Sao chép liên kết bên dưới để chia sẻ tác phẩm của bạn với mọi người.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input 
                  readOnly 
                  value={`${window.location.origin}/story/${shareStory.id}-${shareStory.slug}`} 
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/story/${shareStory.id}-${shareStory.slug}`);
                    setCopied(true);
                    toast.success("Đã sao chép liên kết!");
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ background: copied ? '#10b981' : 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {confirmModal.isOpen && createPortal(
        <div className="analytics-modal-overlay" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="analytics-modal-content fade-in-fast" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="analytics-modal-header">
              <h2>{confirmModal.title}</h2>
              <button className="analytics-close-btn" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
                <X size={24} />
              </button>
            </div>
            <div className="analytics-modal-body">
              <p style={{ color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                {confirmModal.message}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Hủy
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  style={confirmModal.title.includes('Xóa') ? { backgroundColor: '#ef4444', color: 'white', borderColor: '#ef4444' } : {}}
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
