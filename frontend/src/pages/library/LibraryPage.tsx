import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LayoutGrid, List as ListIcon, Trash2, Eye, BookOpen, Loader2, Heart, Globe, Lock, MoreVertical, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { getImageUrl } from '../../utils/image';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './Library.css';

interface LibraryItem {
  storyId: number;
  title: string;
  slug: string;
  coverImageUrl: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  description?: string | null;
  viewCount: number;
  chapterCount: number;
  starCount: number;
  readingStatus: string;
  isFavorite: boolean;
  lastReadChapterId: number | null;
  lastReadChapterNumber: number | null;
  lastReadChapterSlug: string | null;
  lastReadChapterTitle: string | null;
  lastReadPosition: number | null;
  lastReadAt: string | null;
}

const fetchLibrary = async (status?: string): Promise<LibraryItem[]> => {
  const url = status ? `/user/reading-history?status=${status}` : '/user/reading-history';
  const { data } = await api.get(url);
  return data;
};

export const LibraryPage: React.FC = () => {
  useDocumentTitle("Thư Viện Của Tôi - Abora");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [expandedListId, setExpandedListId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // State for confirm modal
  const [storyToRemove, setStoryToRemove] = useState<number | null>(null);
  
  // State for reading list addition
  const [selectedStoryForList, setSelectedStoryForList] = useState<LibraryItem | null>(null);
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListPublic, setNewListPublic] = useState(false);
  const [loadingReadStoryId, setLoadingReadStoryId] = useState<number | null>(null);
  const [activeMenuListId, setActiveMenuListId] = useState<number | null>(null);
  const [activeCardMenuId, setActiveCardMenuId] = useState<number | null>(null);
  const [editingList, setEditingList] = useState<any | null>(null);
  const [listToDeleteId, setListToDeleteId] = useState<number | null>(null);

  // Pagination for Infinite Scroll
  const PAGE_SIZE = 10;
  const [displayedCount, setDisplayedCount] = useState<number>(PAGE_SIZE);

  const { data: libraryItems, isLoading } = useQuery({
    queryKey: ['library', activeTab],
    queryFn: () => fetchLibrary(activeTab === 'ALL' ? undefined : activeTab),
    enabled: activeTab !== 'LISTS',
  });

  const { data: readingLists, isLoading: isReadingListsLoading } = useQuery({
    queryKey: ['readingLists', user?.id],
    queryFn: () => api.get(`/reading-lists/users/${user?.id}`).then(res => res.data),
    enabled: !!user?.id && (!!selectedStoryForList || activeTab === 'LISTS'),
  });

  const removeMutation = useMutation({
    mutationFn: async (storyId: number) => {
      await api.delete(`/user/reading-history/${storyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', activeTab] });
      toast.success('Đã xóa truyện khỏi thư viện');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi xóa truyện');
    }
  });

  const toggleListStoryMutation = useMutation({
    mutationFn: async ({ listId, inList, storyId }: { listId: number; inList: boolean; storyId: number }) => {
      if (inList) {
        return api.delete(`/reading-lists/${listId}/stories/${storyId}`);
      } else {
        return api.post(`/reading-lists/${listId}/stories/${storyId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingLists', user?.id] });
      toast.success('Đã cập nhật danh sách đọc');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi cập nhật danh sách đọc');
    }
  });

  const createListMutation = useMutation({
    mutationFn: async ({ name, isPublic }: { name: string; isPublic: boolean }) => {
      return api.post('/reading-lists', { name, isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingLists', user?.id] });
      setNewListName('');
      setIsCreatingNewList(false);
      toast.success('Đã tạo danh sách đọc mới');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi tạo danh sách đọc');
    }
  });

  const updateListMutation = useMutation({
    mutationFn: async ({ id, name, isPublic }: { id: number; name: string; isPublic: boolean }) => {
      return api.put(`/reading-lists/${id}`, { name, isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingLists', user?.id] });
      setNewListName('');
      setEditingList(null);
      setIsCreatingNewList(false);
      toast.success('Đã cập nhật danh sách đọc');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi cập nhật danh sách đọc');
    }
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/reading-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingLists', user?.id] });
      toast.success('Đã xóa danh sách đọc');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi xóa danh sách đọc');
    }
  });

  const handleRemoveConfirm = () => {
    if (storyToRemove !== null) {
      removeMutation.mutate(storyToRemove);
      setStoryToRemove(null);
    }
  };

  const calculateProgress = (item: LibraryItem) => {
    if (!item.chapterCount || !item.lastReadChapterNumber) return 0;
    const progress = Math.round((item.lastReadChapterNumber / item.chapterCount) * 100);
    return Math.min(100, Math.max(0, progress));
  };

  const handleReadStory = async (item: LibraryItem) => {
    if (item.lastReadChapterSlug) {
      navigate(`/story/${item.storyId}-${item.slug}/chapter/${item.lastReadChapterSlug}`);
    } else {
      setLoadingReadStoryId(item.storyId);
      try {
        const { data: story } = await api.get(`/stories/${item.storyId}`);
        if (story.chapters && story.chapters.length > 0) {
          navigate(`/story/${item.storyId}-${item.slug}/chapter/${story.chapters[0].slug}`);
        } else {
          toast.error("Truyện chưa có chương nào để đọc.");
          navigate(`/story/${item.storyId}-${item.slug}`);
        }
      } catch (error) {
        console.error("Lỗi khi tải chương truyện", error);
        toast.error("Không thể tải chương truyện. Đang chuyển hướng về trang chi tiết.");
        navigate(`/story/${item.storyId}-${item.slug}`);
      } finally {
        setLoadingReadStoryId(null);
      }
    }
  };

  const isStoryInList = (list: any, storyId: number) => {
    return list.stories?.some((s: any) => s.id === storyId);
  };

  // Reset pagination and expanded list on tab change
  useEffect(() => {
    setDisplayedCount(PAGE_SIZE);
    setExpandedListId(null);
  }, [activeTab]);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuListId(null);
      setActiveCardMenuId(null);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const safeLibraryItems = libraryItems || [];
  const displayedItems = safeLibraryItems.slice(0, displayedCount);
  const hasMore = displayedCount < safeLibraryItems.length;

  const handleLoadMore = useCallback(() => {
    setDisplayedCount((prev) => Math.min(prev + PAGE_SIZE, safeLibraryItems.length));
  }, [safeLibraryItems.length]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, handleLoadMore]);

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'READING', label: 'Đang đọc' },
    { id: 'LISTS', label: 'Danh sách truyện' }
  ];

  const formatCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  const renderGridCard = (item: LibraryItem) => {
    const isMenuOpen = activeCardMenuId === item.storyId;
    return (
      <div key={item.storyId} className="library-grid-card" style={{ position: 'relative' }}>
        {/* Three dots menu for mobile view */}
        <div className="card-mobile-menu-wrapper">
          <button
            className="card-mobile-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setActiveCardMenuId(isMenuOpen ? null : item.storyId);
            }}
            title="Tùy chọn"
          >
            <MoreVertical size={18} />
          </button>
          
          {isMenuOpen && (
            <div className="card-context-menu">
              <button 
                className="card-context-item"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/story/${item.storyId}-${item.slug}`);
                  setActiveCardMenuId(null);
                }}
              >
                Chi tiết
              </button>
              <button 
                className="card-context-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStoryForList(item);
                  setActiveCardMenuId(null);
                }}
              >
                Thêm vào danh sách
              </button>
              <button 
                className="card-context-item delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setStoryToRemove(item.storyId);
                  setActiveCardMenuId(null);
                }}
              >
                Xóa khỏi thư viện
              </button>
            </div>
          )}
        </div>

        <div className="card-cover-wrapper" onClick={() => handleReadStory(item)}>
          <img 
            src={getImageUrl(item.coverImageUrl, 'cover', item.title)} 
            alt={item.title} 
            className="card-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getImageUrl('', 'cover', item.title);
            }}
          />

          {/* Hover Overlay - Image 3 layout */}
          <div className="card-cover-overlay">
            <button 
              className="overlay-trash-btn"
              onClick={(e) => {
                e.stopPropagation();
                setStoryToRemove(item.storyId);
              }}
              title="Xóa khỏi thư viện"
            >
              <Trash2 size={16} />
            </button>

            <div className="overlay-buttons">
              <button 
                className="overlay-action-btn primary-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReadStory(item);
                }}
                disabled={loadingReadStoryId === item.storyId}
              >
                {loadingReadStoryId === item.storyId ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : item.lastReadChapterNumber ? (
                  'Tiếp tục đọc'
                ) : (
                  'Bắt đầu đọc'
                )}
              </button>
              
              <button 
                className="overlay-action-btn secondary-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/story/${item.storyId}-${item.slug}`);
                }}
              >
                Chi Tiết
              </button>
              
              <button 
                className="overlay-action-btn secondary-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStoryForList(item);
                }}
              >
                Thêm vào danh sách
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar (under cover) - show progress or 0% to prevent misalignment */}
        <div className="card-progress-bar-container" title={`Đã đọc: ${calculateProgress(item)}%`}>
          <div 
            className="card-progress-bar-fill" 
            style={{ width: `${calculateProgress(item)}%` }}
          ></div>
        </div>

      <div className="card-info">
        <div className="card-info-header">
          <div className="card-info-left">
            {/* Row 1: Title */}
            <h3 className="card-title" onClick={() => navigate(`/story/${item.storyId}-${item.slug}`)} title={item.title}>
              {item.title}
            </h3>
            {/* Row 2: Author Name */}
            <span className="card-author-name">{item.authorName}</span>
          </div>

          {/* Avatar on the right */}
          <div className="card-author-avatar-wrapper" title={item.authorName}>
            <img 
              src={getImageUrl(item.authorAvatarUrl, 'avatar', item.authorName)} 
              alt={item.authorName} 
              className="card-author-avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', item.authorName);
              }}
            />
          </div>
        </div>

        {/* Row 3: Views & Hearts */}
        <div className="card-stats-row">
          <span className="library-stat-item-view">
            <Eye size={13} /> {formatCount(item.viewCount || 0)}
          </span>
          <span className="library-stat-item-heart">
            <Heart size={13} /> {formatCount(item.starCount || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

  const renderListItem = (item: LibraryItem) => {
    const progress = calculateProgress(item);
    return (
      <div key={item.storyId} className="library-list-item">
        {/* Cover */}
        <div className="list-cover-wrapper" onClick={() => navigate(`/story/${item.storyId}-${item.slug}`)}>          
          <img
            src={getImageUrl(item.coverImageUrl, 'cover', item.title)}
            alt={item.title}
            className="list-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getImageUrl('', 'cover', item.title);
            }}
          />
        </div>

        {/* Info */}
        <div className="list-info">
          <div className="list-info-header">
            <div className="list-title-author">
              <h3 className="list-title" onClick={() => navigate(`/story/${item.storyId}-${item.slug}`)} title={item.title}>
                {item.title}
              </h3>
              <p className="list-author">{item.authorName}</p>
            </div>
            
            <button
              className="action-btn-delete"
              onClick={() => setStoryToRemove(item.storyId)}
              title="Xóa khỏi thư viện"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="list-stats">
            <span className="library-stat-item library-stat-item-view"><Eye size={13} /> {formatCount(item.viewCount || 0)}</span>
            <span className="library-stat-item library-stat-item-heart"><Heart size={13} /> {formatCount(item.starCount || 0)}</span>
            <span className="library-stat-item library-stat-item-chapters"><BookOpen size={13} /> {item.chapterCount} chương</span>
          </div>

          <p className="list-description" title={item.description || "Chưa có mô tả truyện."}>
            {item.description ? `"${item.description}"` : "Chưa có mô tả truyện."}
          </p>

          <div className="list-progress-section">
            <div className="progress-text-row">
              <span className="progress-chapters-text">
                {item.lastReadChapterNumber && item.chapterCount > 0 
                  ? `Đã đọc ${item.lastReadChapterNumber}/${item.chapterCount} chương • ${progress}%` 
                  : 'Chưa đọc'}
              </span>
              <button 
                className="list-read-btn"
                onClick={() => handleReadStory(item)}
                disabled={loadingReadStoryId === item.storyId}
              >
                {loadingReadStoryId === item.storyId ? (
                  <Loader2 className="animate-spin" size={13} />
                ) : item.lastReadChapterNumber ? (
                  'Đọc tiếp'
                ) : (
                  'Đọc ngay'
                )}
              </button>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="library-page">
      <div className="library-container">
        <div className="library-header">
          <div>
            <h1 className="library-title">Thư viện của tôi</h1>
            <p className="library-subtitle">Quản lý và tiếp tục đọc các tác phẩm yêu thích của bạn</p>
          </div>
          
          <div className="library-view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Dạng lưới"
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Dạng danh sách"
            >
              <ListIcon size={20} />
            </button>
          </div>
        </div>

        <div className="library-tabs-bar">
          <div className="library-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'LISTS' ? (
          expandedListId !== null ? (
            (() => {
              const selectedList = readingLists?.find((l: any) => l.id === expandedListId);
              if (!selectedList) {
                setExpandedListId(null);
                return null;
              }
              const mappedItems: LibraryItem[] = (selectedList.stories || []).map((s: any) => ({
                storyId: s.id,
                title: s.title,
                slug: s.slug,
                coverImageUrl: s.coverImageUrl,
                authorName: s.authorName,
                authorAvatarUrl: null,
                description: s.description || null,
                viewCount: s.viewCount || 0,
                chapterCount: s.chapterCount || 0,
                starCount: s.followCount || 0,
                readingStatus: 'READING',
                isFavorite: false,
                lastReadChapterId: null,
                lastReadChapterNumber: null,
                lastReadChapterSlug: null,
                lastReadChapterTitle: null,
                lastReadPosition: null,
                lastReadAt: null
              }));

              return (
                <div className="reading-list-detail-view">
                  <div className="list-detail-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button 
                      onClick={() => setExpandedListId(null)}
                      className="list-back-btn"
                      title="Quay lại danh sách"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {selectedList.name}
                        {selectedList.isPublic ? (
                          <Globe size={18} style={{ color: 'rgba(255, 255, 255, 0.45)' }} />
                        ) : (
                          <Lock size={18} style={{ color: 'rgba(255, 255, 255, 0.45)' }} />
                        )}
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                        Có {selectedList.stories?.length || 0} truyện trong danh sách này
                      </p>
                    </div>
                  </div>

                  {mappedItems.length === 0 ? (
                    <div className="library-empty" style={{ padding: '3rem 1rem' }}>
                      <BookOpen size={40} className="text-muted" />
                      <h3>Danh sách trống</h3>
                      <p>Chưa có truyện nào trong danh sách này.</p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="library-grid">
                      {mappedItems.map((item) => renderGridCard(item))}
                    </div>
                  ) : (
                    <div className="library-list">
                      {mappedItems.map((item) => renderListItem(item))}
                    </div>
                  )}
                </div>
              );
            })()
          ) : isReadingListsLoading ? (
            <div className="library-loading">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : !readingLists || readingLists.length === 0 ? (
            <div className="library-empty">
              <ListIcon size={48} className="text-muted" />
              <h3>Chưa có danh sách truyện</h3>
              <p>Tạo danh sách truyện để gom nhóm các tác phẩm yêu thích của bạn.</p>
              
              <Button 
                onClick={() => {
                  setNewListName('');
                  setNewListPublic(false);
                  setIsCreatingNewList(true);
                }}
                variant="primary"
                className="mt-3"
              >
                + Tạo danh sách mới
              </Button>
            </div>
          ) : (
            <div className="reading-lists-container">
              {/* Header with Quick Create button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Danh sách của tôi ({readingLists.length})</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setNewListName('');
                    setNewListPublic(false);
                    setIsCreatingNewList(true);
                  }}
                >
                  + Tạo danh sách mới
                </Button>
              </div>

              <div className="reading-lists-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {readingLists.map((list: any) => (
                  <div 
                    key={list.id} 
                    className="reading-list-card"
                    onClick={() => setExpandedListId(list.id)}
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      border: '1px solid rgba(255, 255, 255, 0.06)', 
                      borderRadius: '16px', 
                      padding: '1.5rem', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.4)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'relative' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: '0.5rem' }}>
                        {list.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.45)' }}>
                          {list.isPublic ? (
                            <Globe size={13} />
                          ) : (
                            <Lock size={13} />
                          )}
                        </span>
                        
                        {/* Three dots button */}
                        <div className="list-menu-wrapper" style={{ position: 'relative' }}>
                          <button
                            className="list-menu-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuListId(activeMenuListId === list.id ? null : list.id);
                            }}
                            title="Tùy chọn danh sách"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMenuListId === list.id && (
                            <div className="list-context-menu">
                              <button 
                                className="list-context-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewListName(list.name);
                                  setNewListPublic(list.isPublic);
                                  setEditingList(list);
                                  setIsCreatingNewList(true);
                                  setActiveMenuListId(null);
                                }}
                              >
                                Chỉnh sửa
                              </button>
                              <button 
                                className="list-context-item delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setListToDeleteId(list.id);
                                  setActiveMenuListId(null);
                                }}
                              >
                                Xóa
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Book cover collage preview */}
                    <div className="list-covers-preview" style={{ display: 'flex', gap: '0.5rem', height: '90px', margin: '1rem 0', background: 'rgba(0,0,0,0.15)', padding: '0.5rem', borderRadius: '8px' }}>
                      {list.stories && list.stories.slice(0, 4).map((s: any) => (
                        <img 
                          key={s.id}
                          src={s.coverImageUrl || "https://placehold.co/100x150/1a1a24/8b5cf6?text=Abora"}
                          alt={s.title}
                          style={{ height: '100%', width: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                      ))}
                      {(!list.stories || list.stories.length === 0) && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
                          Danh sách trống
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>{list.stories?.length || 0} truyện</span>
                      <span style={{ color: 'var(--primary-color, #9d4edd)', fontWeight: 600 }}>Xem chi tiết</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : isLoading ? (
          <div className="library-loading">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : safeLibraryItems.length === 0 ? (
          <div className="library-empty">
            <BookOpen size={48} className="text-muted" />
            <h3>Thư viện trống</h3>
            <p>Bạn chưa thêm tác phẩm nào vào mục này.</p>
            <Button variant="primary" onClick={() => navigate('/explore')}>
              Khám phá ngay
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="library-grid">
            {displayedItems.map((item) => renderGridCard(item))}
          </div>
        ) : (
          <div className="library-list">
            {displayedItems.map((item) => renderListItem(item))}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {activeTab !== 'LISTS' && hasMore && (
          <div ref={loadMoreRef} className="library-load-more-trigger" style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={storyToRemove !== null}
        title="Xóa khỏi thư viện"
        message="Bạn có chắc chắn muốn xóa truyện này khỏi thư viện của bạn?"
        confirmText="Xóa"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={handleRemoveConfirm}
        onCancel={() => setStoryToRemove(null)}
      />

      <ConfirmModal
        isOpen={listToDeleteId !== null}
        title="Xóa danh sách đọc"
        message="Bạn có chắc chắn muốn xóa danh sách đọc này? Các truyện bên trong danh sách sẽ không bị ảnh hưởng."
        confirmText="Xóa"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={() => {
          if (listToDeleteId !== null) {
            deleteListMutation.mutate(listToDeleteId);
            setListToDeleteId(null);
          }
        }}
        onCancel={() => setListToDeleteId(null)}
      />

      {/* Modal Thêm vào danh sách đọc */}
      {selectedStoryForList && (
        <div className="reading-list-modal-overlay" onClick={() => setSelectedStoryForList(null)}>
          <div className="reading-list-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="reading-list-modal-header">
              <h3>Thêm vào danh sách đọc</h3>
              <button className="close-modal-btn" onClick={() => setSelectedStoryForList(null)}>×</button>
            </div>
            
            <div className="reading-list-modal-body">
              {isReadingListsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : (
                <div className="reading-list-checkboxes">
                  {readingLists && readingLists.map((list: any) => {
                    const inList = isStoryInList(list, selectedStoryForList.storyId);
                    return (
                      <label key={list.id} className="reading-list-checkbox-label">
                        <input
                          type="checkbox"
                          checked={inList}
                          onChange={() => toggleListStoryMutation.mutate({ 
                            listId: list.id, 
                            inList, 
                            storyId: selectedStoryForList.storyId 
                          })}
                          disabled={toggleListStoryMutation.isPending}
                        />
                        <span className="checkbox-custom"></span>
                        <span className="list-name-text" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {list.name}
                          {list.isPublic ? (
                            <Globe size={13} style={{ color: 'rgba(255, 255, 255, 0.45)' }} />
                          ) : (
                            <Lock size={13} style={{ color: 'rgba(255, 255, 255, 0.45)' }} />
                          )}
                        </span>
                      </label>
                    );
                  })}
                  {(!readingLists || readingLists.length === 0) && (
                    <p className="no-lists-text" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '1rem 0', fontSize: '0.85rem' }}>
                      Bạn chưa có danh sách đọc nào.
                    </p>
                  )}
                </div>
              )}

              {/* Nút mở modal tạo danh sách mới */}
              <button 
                className="create-new-list-trigger-btn"
                onClick={() => {
                  setNewListName('');
                  setNewListPublic(false);
                  setIsCreatingNewList(true);
                }}
                style={{ marginTop: '1rem' }}
              >
                + Tạo danh sách đọc mới
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Tạo danh sách đọc mới (YouTube/Premium style) */}
      {isCreatingNewList && (
        <div className="create-list-modal-overlay" onClick={() => {
          setIsCreatingNewList(false);
          setEditingList(null);
          setNewListName('');
          setNewListPublic(false);
        }}>
          <div className="create-list-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="create-list-modal-title">{editingList ? 'Chỉnh sửa danh sách đọc' : 'Tạo danh sách đọc'}</h3>
            
            <input
              type="text"
              placeholder="ví dụ: Sách viễn tưởng hay nhất"
              value={newListName}
              onChange={(e) => {
                if (e.target.value.length <= 80) {
                  setNewListName(e.target.value);
                }
              }}
              maxLength={80}
              className="create-list-modal-input"
              autoFocus
            />
            
            <div className="create-list-modal-counter">
              {newListName.length}/80 ký tự
            </div>
            
            <div className="create-list-modal-privacy">
              <label className="create-list-privacy-option">
                <input
                  type="radio"
                  name="modal-privacy"
                  checked={!newListPublic}
                  onChange={() => setNewListPublic(false)}
                />
                <span className="create-list-radio-circle"></span>
                <span>Riêng tư</span>
              </label>
              
              <label className="create-list-privacy-option">
                <input
                  type="radio"
                  name="modal-privacy"
                  checked={newListPublic}
                  onChange={() => setNewListPublic(true)}
                />
                <span className="create-list-radio-circle"></span>
                <span>Công khai</span>
              </label>
            </div>
            
            <div className="create-list-modal-actions">
              <button
                className="create-list-modal-btn cancel"
                onClick={() => {
                  setIsCreatingNewList(false);
                  setEditingList(null);
                  setNewListName('');
                  setNewListPublic(false);
                }}
              >
                Hủy bỏ
              </button>
              <button
                className={`create-list-modal-btn submit ${!newListName.trim() ? 'disabled' : ''}`}
                onClick={() => {
                  if (newListName.trim()) {
                    if (editingList) {
                      updateListMutation.mutate({
                        id: editingList.id,
                        name: newListName.trim(),
                        isPublic: newListPublic
                      });
                    } else {
                      createListMutation.mutate({
                        name: newListName.trim(),
                        isPublic: newListPublic
                      });
                    }
                  }
                }}
                disabled={!newListName.trim() || createListMutation.isPending || updateListMutation.isPending}
              >
                {createListMutation.isPending || updateListMutation.isPending ? 'Đang lưu...' : (editingList ? 'Lưu' : 'Tạo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
