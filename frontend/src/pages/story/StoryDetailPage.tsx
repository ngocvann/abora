import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import type { PublicStoryDetail } from "../../types/story";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/Button";
import { Library, BookOpen, Plus, List, Flag, Check, Globe, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { ReportModal } from '../../components/ui/ReportModal';
import { getImageUrl } from "../../utils/image";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import "./StoryDetail.css";

const fetchStoryDetail = async (slug: string): Promise<PublicStoryDetail> => {
  const { data } = await api.get(`/stories/${slug}`);
  return data;
};

const formatAgeRating = (rating?: string | null) => {
  if (!rating) return "Mọi lứa tuổi";
  switch (rating) {
    case "EVERYONE": return "Mọi lứa tuổi";
    case "TEEN": return "Thiếu niên (13+)";
    case "MATURE": return "Trưởng thành (18+)";
    default: return rating;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${dayName}, thg ${month} ${day}, ${year}`;
};

const getRelativeTime = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears >= 1) {
    return formatDate(dateString);
  }
  if (diffMonths >= 1) {
    return `${diffMonths} tháng`;
  }
  if (diffWeeks >= 1) {
    return `${diffWeeks} tuần`;
  }
  if (diffDays >= 1) {
    return `${diffDays} ngày`;
  }
  if (diffHours >= 1) {
    return `${diffHours} giờ`;
  }
  if (diffMins >= 1) {
    return `${diffMins} phút`;
  }
  return "Vừa xong";
};

export const StoryDetailPage: React.FC = () => {
  // Helper to format large numbers (e.g., 1.2k, 3m)
  const formatCount = (num: number) => {
    if (num >= 1e6) {
      const val = (num / 1e6).toFixed(num % 1e6 === 0 ? 0 : 1);
      return `${val.replace(/\.0$/, '')}m`;
    }
    if (num >= 1e3) {
      const val = (num / 1e3).toFixed(num % 1e3 === 0 ? 0 : 1);
      return `${val.replace(/\.0$/, '')}k`;
    }
    return num.toString();
  };

  const { slug } = useParams<{ slug: string }>();
  const [addedToLibrary, setAddedToLibrary] = useState(false);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const currentUser = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  
  const [isLibraryDropdownOpen, setIsLibraryDropdownOpen] = useState(false);
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newListStr, setNewListStr] = useState("");
  const [newListIsPublic, setNewListIsPublic] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // Modal does not require click outside ref listener
  const [activeTab, setActiveTab] = useState<"summary" | "chapters">("summary");
  const [showAllTags, setShowAllTags] = useState(false);
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  const scrollRelatedStories = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const { data: readingLists, isLoading: isReadingListsLoading } = useQuery({
    queryKey: ["readingLists", currentUser?.id],
    queryFn: () => api.get(`/reading-lists/users/${currentUser?.id}`).then(res => res.data),
    enabled: isAuthenticated && !!currentUser?.id && isLibraryDropdownOpen,
  });

  const toggleStoryInListMutation = useMutation({
    mutationFn: async ({ listId, inList }: { listId: number; inList: boolean }) => {
      if (inList) {
        return api.delete(`/reading-lists/${listId}/stories/${story?.id}`);
      } else {
        return api.post(`/reading-lists/${listId}/stories/${story?.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readingLists", currentUser?.id] });
    },
    onError: () => {
      alert("Đã có lỗi xảy ra khi cập nhật danh sách đọc");
    }
  });

  const { data: libraryItems } = useQuery({
    queryKey: ["library", "ALL"],
    queryFn: () => api.get('/user/reading-history?status=ALL').then(res => res.data),
    enabled: isAuthenticated,
  });

  const {
    data: story,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["story", slug],
    queryFn: () => fetchStoryDetail(slug as string),
    enabled: !!slug,
  });

  const pageTitle = story 
    ? `${story.title} - Đọc Truyện Online - Abora`
    : "Đang tải... - Abora";
  useDocumentTitle(pageTitle);

  const { data: recommendations = [] } = useQuery<any[]>({
    queryKey: ["stories", "recommendations"],
    queryFn: () => api.get("/stories/recommendations").then(res => res.data),
  });

  const currentStoryCategories = story?.categories?.map((c: any) => c.id) || [];
  const relatedStories = (recommendations || [])
    .filter((s: any) => s.id !== story?.id)
    .sort((a: any, b: any) => {
      const commonA = a.categories?.filter((c: any) => currentStoryCategories.includes(c.id)).length || 0;
      const commonB = b.categories?.filter((c: any) => currentStoryCategories.includes(c.id)).length || 0;
      return commonB - commonA;
    })
    .slice(0, 15);

  useEffect(() => {
    if (libraryItems && story) {
      const isInLibrary = libraryItems.some((item: any) => item.storyId === story.id);
      setAddedToLibrary(isInLibrary);
    }
  }, [libraryItems, story]);

  useEffect(() => {
    handleScroll();
  }, [relatedStories]);

  const currentHistoryItem = libraryItems?.find((item: any) => item.storyId === story?.id);
  const markedChapterSlug = currentHistoryItem?.lastReadChapterSlug 
    || (story?.chapters && story.chapters.length > 0 ? story.chapters[0].slug : null);

  const toggleLibraryMutation = useMutation({
    mutationFn: async () => {
      if (addedToLibrary) {
        return api.delete(`/user/reading-history/${story?.id}`);
      } else {
        return api.post('/user/reading-history/add', { storyId: story?.id, status: 'READ_LATER' });
      }
    },
    onSuccess: () => {
      setAddedToLibrary(!addedToLibrary);
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
    onError: () => {
      alert("Đã có lỗi xảy ra khi cập nhật thư viện");
    }
  });

  const createReadingListMutation = useMutation({
    mutationFn: ({ name, isPublic }: { name: string; isPublic: boolean }) => 
      api.post('/reading-lists', { name, isPublic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readingLists", currentUser?.id] });
    },
    onError: () => {
      alert("Đã có lỗi xảy ra khi tạo danh sách đọc");
    }
  });

  const handleReportClick = () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để báo cáo truyện này!");
      return;
    }
    setIsReportModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span
          className="spinner"
          style={{
            width: "3rem",
            height: "3rem",
            borderTopColor: "var(--primary-color)",
          }}
        ></span>
      </div>
    );
  }

  if (isError || !story) {
    return (
      <div className="glass-panel p-8 text-center mt-8">
        <h2>Không tìm thấy truyện</h2>
        <p className="text-secondary mt-2">
          Truyện này không tồn tại hoặc đã bị gỡ.
        </p>
        <Link to="/">
          <Button variant="outline" className="mt-4">
            Quay về trang chủ
          </Button>
        </Link>
      </div>
    );
  }


  return (
    <div className="story-detail-container fade-in">
      {/* Story Info Block */}
      <div className="story-header">
        <div className="story-header-cover">
          <img 
            src={getImageUrl(story.coverImageUrl, 'cover', story.title)} 
            alt={story.title} 
            onError={(e) => {
              (e.target as HTMLImageElement).src = getImageUrl('', 'cover', story.title);
            }}
          />
        </div>
        <div className="story-header-info">
          <h1 className="story-header-title">{story.title}</h1>
          <div className="story-header-author-section" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
            <Link to={`/${story.authorUsername}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="author-avatar-circle" style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <img 
                  src={getImageUrl(story.authorAvatarUrl, 'avatar', story.authorName)} 
                  alt={story.authorName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', story.authorName);
                  }}
                />
              </div>
              <span className="author-name" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.95rem' }}>{story.authorName}</span>
            </Link>
          </div>

          <div className="story-header-stats">
            <div className="stat-item">
              <span className="stat-value">{story.chapters?.length || 0}</span>
              <span className="stat-label">Chương</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {story.viewCount.toLocaleString()}
              </span>
              <span className="stat-label">Lượt xem</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {(story.favoriteCount ?? 0).toLocaleString()}
              </span>
              <span className="stat-label">Yêu thích</span>
            </div>
          </div>

          <div className="story-header-actions">
            <Link to={story.chapters?.length > 0 ? `/story/${story.id}-${story.slug}/chapter/${markedChapterSlug || story.chapters[0].slug}` : '#'}>
              <Button variant="primary" size="lg" disabled={!story.chapters || story.chapters.length === 0} style={{ display: 'flex', alignItems: 'center' }}>
                <BookOpen size={20} style={{ marginRight: '8px' }} /> {currentHistoryItem?.lastReadChapterSlug ? "Đọc tiếp" : "Đọc truyện"}
              </Button>
            </Link>
            
            <div className="library-dropdown-container">
              <button 
                className="library-plus-btn"
                onClick={() => {
                  if (isAuthenticated) {
                    setIsLibraryDropdownOpen(true);
                  } else {
                    alert("Vui lòng đăng nhập để thêm truyện!");
                  }
                }}
                title="Thêm vào..."
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Story Detail & TOC Tabs Block */}
      <div className="story-tabs-container">
        <div className="story-tabs-header">
          <button 
            className={`story-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Tóm tắt
          </button>
          <button 
            className={`story-tab-btn ${activeTab === 'chapters' ? 'active' : ''}`}
            onClick={() => setActiveTab('chapters')}
          >
            Chương
          </button>
        </div>

        <div className="story-tab-content">
          {activeTab === 'summary' ? (
            <div className="story-summary-tab-content">
              {/* Last Updated Date (cập nhật lần cuối thì để chữ nhỏ nhỏ góc phải) */}
              <span className="story-meta-date-top-right">
                Cập nhật: {getRelativeTime(story.updatedAt || story.createdAt)}
              </span>

              {/* Status Row */}
              <div className="story-meta-info-row">
                <BookOpen size={16} className="story-meta-icon" />
                <span className="story-meta-status">
                  {story.status === 'COMPLETED' ? 'Hoàn thành' : 'Chưa hoàn thành'}
                </span>
              </div>

              {/* Categories/Genres Row (thể loại bên dưới chưa hoàn thành) */}
              <div className="story-meta-categories-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '-4px' }}>
                <span className="story-meta-genre-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Thể loại:</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {story.categories && story.categories.length > 0 ? (
                    story.categories.map((c: any) => (
                      <span key={c.id} className="story-genre-badge">{c.name}</span>
                    ))
                  ) : (
                    <span className="story-genre-badge">Chưa phân loại</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="story-summary-description-container">
                <p className="story-summary-description">
                  {story.description || "Chưa có lời giới thiệu."}
                </p>
              </div>

              {/* Bottom Metadata & Tags (bỏ chữ độ tuổi và thẻ tag) */}
              <div className="story-summary-bottom-section">
                <div className="story-summary-age-rating-wrapper">
                  <span className={`age-rating-badge ${story.ageRating || 'EVERYONE'}`}>
                    {formatAgeRating(story.ageRating)}
                  </span>
                </div>

                {story.tags && story.tags.length > 0 && (
                  <div className="story-summary-tags-wrapper">
                    <div className="story-summary-tags-list">
                      {(showAllTags ? story.tags : story.tags.slice(0, 12)).map((tag: any) => (
                        <span key={tag.id} className="story-summary-tag-chip">
                          #{tag.name}
                        </span>
                      ))}
                      {story.tags.length > 12 && (
                        <button 
                          className="story-summary-tags-toggle"
                          onClick={() => setShowAllTags(!showAllTags)}
                        >
                          {showAllTags ? "Ẩn bớt" : `Xem thêm (+${story.tags.length - 12})`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="story-chapters-tab-content">
              {!story.chapters || story.chapters.length === 0 ? (
                <p className="text-secondary mt-4">
                  Truyện chưa có chương nào được xuất bản.
                </p>
              ) : (
                <div className="chapter-list">
                  {story.chapters.map((chapter) => {
                    const isMarked = chapter.slug === markedChapterSlug;
                    return (
                      <Link
                        to={`/story/${story.id}-${story.slug}/chapter/${chapter.slug}`}
                        key={chapter.id}
                        className={`chapter-item ${isMarked ? 'current-reading' : ''}`}
                      >
                        <span className="chapter-title">{chapter.title}</span>
                        <span className="chapter-date">
                          {chapter.publishedAt ? getRelativeTime(chapter.publishedAt) : ""}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <hr className="story-divider" />

      {/* Report Button */}
      <div className="story-report-section">
        <button 
          className="story-report-btn"
          onClick={handleReportClick}
        >
          <Flag size={14} /> Báo cáo truyện này
        </button>
      </div>

      {/* Related Stories Section */}
      {relatedStories.length > 0 && (
        <div className="related-stories-section">
          <div className="related-stories-header">
            <h3 className="related-stories-title">Có thể bạn cũng thích</h3>
          </div>
          <div className="related-stories-nav">
            {canScrollLeft && (
              <button className="nav-btn" onClick={() => scrollRelatedStories('left')}>
                <ChevronLeft size={20} />
              </button>
            )}
            {canScrollRight && (
              <button className="nav-btn" onClick={() => scrollRelatedStories('right')} style={{ marginLeft: 'auto' }}>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
          <div className="related-stories-scroll-container" ref={scrollContainerRef} onScroll={handleScroll}>
            {relatedStories.map((item) => {
              const coverUrl = getImageUrl(item.coverImageUrl, 'cover', item.title);
              const chCount = item.publishedChapterCount ?? item.chapterCount ?? 0;
              return (
                <Link to={`/story/${item.id}-${item.slug}`} key={item.id} className="related-story-card">
                  <div className="related-story-cover-wrapper">
                    <img src={coverUrl} alt={item.title} className="related-story-cover" />
                  </div>
                  <div className="related-story-details">
                    <h4 className="related-story-title-text" title={item.title}>{item.title}</h4>
                    <p className="related-story-author">{item.authorName}</p>
                    <div className="related-story-stats">
                      <span className="related-story-stat-item">{chCount} chương</span>
                      <span className="related-story-stat-item">·</span>
                      <span className="related-story-stat-item">{formatCount(item.viewCount ?? 0)} lượt xem</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Add to Library / Reading List Modal */}
      {isLibraryDropdownOpen && createPortal(
        <div className="library-modal-overlay" onClick={() => {
          setIsLibraryDropdownOpen(false);
          setIsCreatingNewList(false);
          setNewListStr("");
          setNewListIsPublic(false);
        }}>
          <div className="library-modal-content fade-in-fast" onClick={(e) => e.stopPropagation()}>
            <div className="library-modal-header">
              <span className="library-modal-title">{isCreatingNewList ? "Tạo danh sách đọc" : "Thêm vào"}</span>
              <button 
                className="library-modal-close-btn"
                onClick={() => {
                  setIsLibraryDropdownOpen(false);
                  setIsCreatingNewList(false);
                  setNewListStr("");
                  setNewListIsPublic(false);
                }}
              >
                ×
              </button>
            </div>

            {!isCreatingNewList ? (
              <>
                <div className="library-modal-list">
                  {/* Thư viện của tôi */}
                  <div 
                    className="library-modal-item"
                    onClick={() => toggleLibraryMutation.mutate()}
                  >
                    <span className="library-modal-item-label">
                      <Library size={16} className="library-dropdown-icon" /> Thư Viện của Tôi (Riêng tư)
                    </span>
                    {addedToLibrary && <Check size={16} style={{ color: 'var(--primary-color, #8b5cf6)' }} />}
                  </div>

                  {/* Danh sách đọc custom */}
                  {isReadingListsLoading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                      <span className="spinner"></span>
                    </div>
                  )}

                  {!isReadingListsLoading && readingLists && readingLists.map((list: any) => {
                    const inList = list.stories?.some((s: any) => s.id === story.id);
                    return (
                      <div 
                        key={list.id} 
                        className="library-modal-item"
                        onClick={() => toggleStoryInListMutation.mutate({ listId: list.id, inList })}
                      >
                        <span className="library-modal-item-label">
                          <List size={16} className="library-dropdown-icon" />
                          <span>{list.name}</span>
                          {list.isPublic ? (
                            <Globe size={14} className="library-dropdown-icon" />
                          ) : (
                            <Lock size={14} className="library-dropdown-icon" />
                          )}
                        </span>
                        {inList && <Check size={16} style={{ color: 'var(--primary-color, #8b5cf6)' }} />}
                      </div>
                    );
                  })}
                </div>

                <button 
                  className="library-modal-create-btn"
                  onClick={() => setIsCreatingNewList(true)}
                >
                  <Plus size={16} className="library-dropdown-icon" /> Tạo danh sách đọc
                </button>
              </>
            ) : (
              <div className="library-modal-create-view">
                <div 
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}
                >
                  <input
                    type="text"
                    placeholder="Tên danh sách đọc..."
                    value={newListStr}
                    onChange={(e) => setNewListStr(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-main)',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.9rem'
                    }}
                    autoFocus
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                  <span>{newListStr.length}/80 ký tự</span>
                </div>

                <div style={{ display: 'flex', gap: '16px', margin: '12px 0 16px 0', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', userSelect: 'none' }}>
                    <input 
                      type="radio" 
                      name="modalListPrivacy" 
                      checked={!newListIsPublic} 
                      onChange={() => setNewListIsPublic(false)}
                      style={{ accentColor: '#8b5cf6', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Riêng tư
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', userSelect: 'none' }}>
                    <input 
                      type="radio" 
                      name="modalListPrivacy" 
                      checked={newListIsPublic} 
                      onChange={() => setNewListIsPublic(true)}
                      style={{ accentColor: '#8b5cf6', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Công khai
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '1.25rem' }}>
                  <button 
                    onClick={() => {
                      setIsCreatingNewList(false);
                      setNewListStr("");
                      setNewListIsPublic(false);
                    }}
                    style={{
                      flex: 1,
                      background: 'none',
                      border: '1.5px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '9999px',
                      color: 'white',
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={() => {
                      if (newListStr.trim() && newListStr.length <= 80) {
                        createReadingListMutation.mutate({ name: newListStr.trim(), isPublic: newListIsPublic });
                        setIsCreatingNewList(false);
                        setNewListStr("");
                        setNewListIsPublic(false);
                      }
                    }}
                    disabled={!newListStr.trim() || newListStr.length > 80 || createReadingListMutation.isPending}
                    style={{
                      flex: 1,
                      background: newListStr.trim() ? 'var(--primary-color, #8b5cf6)' : '#333',
                      border: 'none',
                      borderRadius: '9999px',
                      color: newListStr.trim() ? 'white' : 'rgba(255,255,255,0.4)',
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: newListStr.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s'
                    }}
                  >
                    Tạo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>, document.body
      )}
      {story && (
        <ReportModal 
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="STORY"
          targetId={story.id}
        />
      )}
    </div>
  );
};
