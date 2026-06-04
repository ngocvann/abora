import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../../services/api";
import type { ReadChapterResponse, PublicStoryDetail } from "../../types/story";
import { useQueryClient } from "@tanstack/react-query";
import { useReaderStore } from "../../store/readerStore";
import { useAuthStore } from "../../store/authStore";
import { CommentSidebar } from "../../components/reader/CommentSidebar";
import { ReportModal } from "../../components/ui/ReportModal";
import { ChevronDown, Plus, Heart, Type, MessageCircle, Link as LinkIcon, Eye, ArrowLeft, Library, List, Globe, Lock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from "../../utils/image";
import "./ReaderPage.css";

const fetchChapter = async (
  slug: string,
  chapterSlug: string,
): Promise<ReadChapterResponse> => {
  const { data } = await api.get(`/stories/${slug}/chapters/${chapterSlug}`);
  return data;
};

const fetchStoryDetail = async (slug: string): Promise<PublicStoryDetail> => {
  const { data } = await api.get(`/stories/${slug}`);
  return data;
};

export const ReaderPage: React.FC = () => {
  const { slug, chapterSlug } = useParams<{
    slug: string;
    chapterSlug: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { fontSize, theme, increaseFontSize, decreaseFontSize, setTheme } = useReaderStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCommentPinned, setIsCommentPinned] = useState(false);
  const [commentSidebarWidth, setCommentSidebarWidth] = useState(400);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showMobileBars, setShowMobileBars] = useState(window.innerWidth > 768);

  // Library & Reading List State
  const [isLibraryDropdownOpen, setIsLibraryDropdownOpen] = useState(false);
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newListStr, setNewListStr] = useState("");
  const [newListIsPublic, setNewListIsPublic] = useState(false);
  const [addedToLibrary, setAddedToLibrary] = useState(false);

  const currentUser = useAuthStore((state) => state.user);

  const tocRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tocRef.current && !tocRef.current.contains(event.target as Node)) {
        setShowToc(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Chapter
  const {
    data: chapter,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["chapter", slug, chapterSlug],
    queryFn: () => fetchChapter(slug as string, chapterSlug as string),
    enabled: !!slug && !!chapterSlug,
  });

  // Fetch Story Detail (for Cover, Title and TOC)
  const { data: story } = useQuery({
    queryKey: ["story", slug],
    queryFn: () => fetchStoryDetail(slug as string),
    enabled: !!slug,
  });

  // Fetch comments to show count
  const { data: comments } = useQuery({
    queryKey: ['comments', chapter?.id],
    queryFn: () => api.get(`/chapters/${chapter?.id}/comments`).then(res => res.data),
    enabled: !!chapter?.id,
  });

  // Mutation to save history
  const saveHistoryMutation = useMutation({
    mutationFn: (data: { storyId: number; chapterId: number; lastReadPosition?: number }) => {
      return api.post("/user/reading-history", data);
    },
  });

  // Mutation to toggle like
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!chapter) return;
      if (chapter.hasLiked) {
        return api.delete(`/stories/${chapter.storyId}/chapters/${chapter.id}/like`);
      } else {
        return api.post(`/stories/${chapter.storyId}/chapters/${chapter.id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapter", slug, chapterSlug] });
    }
  });

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: `/story/${slug}/chapter/${chapterSlug}` } });
      return;
    }
    toggleLikeMutation.mutate();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast('Đã sao chép liên kết!', {
      style: {
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
        color: 'var(--reader-text)',
        backdropFilter: 'none',
        padding: 0
      }
    });
  };

  // Fetch Library Status
  const { data: libraryItems } = useQuery({
    queryKey: ["library", "ALL"],
    queryFn: () => api.get('/user/reading-history?status=ALL').then(res => res.data),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (libraryItems && story) {
      const isInLibrary = libraryItems.some((item: any) => item.storyId === story.id);
      setAddedToLibrary(isInLibrary);
    }
  }, [libraryItems, story]);

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
      toast.success(addedToLibrary ? "Đã xóa khỏi thư viện" : "Đã thêm vào thư viện");
    },
    onError: () => {
      toast.error("Đã có lỗi xảy ra khi cập nhật thư viện");
    }
  });

  // Reading Lists
  const { data: readingLists, isLoading: isReadingListsLoading } = useQuery({
    queryKey: ["readingLists", currentUser?.id],
    queryFn: () => api.get(`/reading-lists/users/${currentUser?.id}`).then(res => res.data),
    enabled: isAuthenticated && !!currentUser?.id && isLibraryDropdownOpen,
  });

  const createReadingListMutation = useMutation({
    mutationFn: ({ name, isPublic }: { name: string; isPublic: boolean }) => 
      api.post('/reading-lists', { name, isPublic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readingLists", currentUser?.id] });
      setIsCreatingNewList(false);
      setNewListStr("");
      setNewListIsPublic(false);
      toast.success("Tạo danh sách đọc thành công");
    },
    onError: () => {
      toast.error("Đã có lỗi xảy ra khi tạo danh sách đọc");
    }
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
      toast.success("Đã cập nhật danh sách đọc");
    },
    onError: () => {
      toast.error("Đã có lỗi xảy ra khi cập nhật danh sách đọc");
    }
  });

  useEffect(() => {
    document.body.classList.add('in-reader-page');
    return () => {
      document.body.classList.remove('in-reader-page');
      document.body.classList.remove('hide-reader-bars');
    };
  }, []);

  useEffect(() => {
    if (!showMobileBars) {
      document.body.classList.add('hide-reader-bars');
    } else {
      document.body.classList.remove('hide-reader-bars');
    }
  }, [showMobileBars]);

  const handlePageClick = () => {
    if (window.innerWidth <= 768) {
      setShowMobileBars(prev => !prev);
    }
  };

  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        document.documentElement.style.setProperty('--navbar-height', `${navbar.getBoundingClientRect().height}px`);
      }
    };
    updateNavbarHeight();
    const timer = setTimeout(updateNavbarHeight, 100);
    window.addEventListener('resize', updateNavbarHeight);
    
    return () => {
      window.removeEventListener('resize', updateNavbarHeight);
      clearTimeout(timer);
    };
  }, [isLoading]);

  useEffect(() => {
    if (chapter) {
      if (chapter.lastReadPosition && chapter.lastReadPosition > 0) {
        window.scrollTo(0, chapter.lastReadPosition);
      } else {
        window.scrollTo(0, 0);
      }
    }

    if (isAuthenticated && chapter) {
      saveHistoryMutation.mutate({
        storyId: chapter.storyId,
        chapterId: chapter.id,
        lastReadPosition: chapter.lastReadPosition || 0
      });
    }
  }, [chapter, isAuthenticated]);

  useEffect(() => {
    if (!chapter) return;

    let timeoutId: number | undefined;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      setScrollProgress(scrollPercent || 0);

      const currentScrollY = window.scrollY;
      
      if (window.innerWidth > 768) {
        if (currentScrollY > lastScrollY && currentScrollY > 60) {
          document.body.classList.add('reader-scroll-down');
        } else if (currentScrollY < lastScrollY) {
          document.body.classList.remove('reader-scroll-down');
        }
      }
      lastScrollY = currentScrollY;

      if (!isAuthenticated) return;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        saveHistoryMutation.mutate({
          storyId: chapter.storyId,
          chapterId: chapter.id,
          lastReadPosition: Math.round(scrollTop)
        });
      }, 2000);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Init progress
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.classList.remove('reader-scroll-down');
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [chapter, isAuthenticated]);

  if (isLoading) {
    return (
      <div className={`reader-container theme-${theme} flex justify-center items-center h-[80vh]`}>
        <span className="spinner" style={{ width: "3rem", height: "3rem", borderTopColor: "var(--primary-color)" }}></span>
      </div>
    );
  }

  if (isError || !chapter) {
    return (
      <div className={`reader-container theme-${theme} flex flex-col items-center justify-center h-[50vh]`}>
        <h2>Lỗi tải chương</h2>
        <p className="text-secondary mt-2">Không thể tải nội dung chương. Vui lòng thử lại.</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate(`/story/${slug}`)}>
          Quay lại truyện
        </button>
      </div>
    );
  }

  const getTotalComments = (commentsData: any[]) => {
    let count = 0;
    if (!commentsData) return count;
    commentsData.forEach(c => {
      count += 1;
      if (c.replies) count += c.replies.length;
    });
    return count;
  };

  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const commentCount = getTotalComments(comments) || chapter?.commentCount || 0;

  return (
    <div 
      className={`reader-wrapper theme-${theme}`}
      style={isCommentPinned && showComments ? { paddingRight: `${commentSidebarWidth}px`, transition: 'padding 0.3s ease' } : { transition: 'padding 0.3s ease' }}
      onClick={handlePageClick}
    >
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="purple-ombre" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8b4fe" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#7e22ce" />
          </linearGradient>
        </defs>
      </svg>
      {/* Sticky Reader Top Bar */}
      <div className="reader-top-bar" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
          <button 
            className="reader-btn" 
            style={{ marginRight: '8px' }}
            title="Quay lại thư viện" 
            onClick={(e) => { e.stopPropagation(); navigate('/library'); }}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="reader-top-bar-left" onClick={(e) => { e.stopPropagation(); setShowToc(!showToc); setShowSettings(false); }}>
            {story?.coverImageUrl && (
              <img 
                src={getImageUrl(story.coverImageUrl, 'cover', story.title)} 
                alt="Cover" 
                className="story-mini-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getImageUrl('', 'cover', story.title);
                }}
              />
            )}
            <div className="reader-top-bar-info">
              <span className="reader-story-title" style={{ fontSize: '12px' }}>{story?.title || 'Đang tải...'}</span>
              <span className="reader-chapter-title" style={{ fontSize: '14px', paddingTop: '5px' }}>{chapter.title}</span>
            </div>
            <ChevronDown size={16} className="text-secondary flex-shrink-0" />
          </div>
        </div>
        
        <div className="reader-top-bar-right">
          <button 
            className="reader-btn" 
            title="Thêm vào thư viện" 
            onClick={(e) => {
              e.stopPropagation();
              if (!isAuthenticated) {
                toast.error('Vui lòng đăng nhập để thêm vào thư viện');
                return;
              }
              setIsLibraryDropdownOpen(true);
            }}
          >
            <Plus size={20} />
          </button>
          <button className="reader-btn" title="Cài đặt đọc" onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setShowToc(false); }}>
            <Type size={20} />
          </button>
          <div className="reader-stat-item" title="Lượt xem">
            <Eye size={20} />
            <span>{formatNumber(chapter.viewCount || 0)}</span>
          </div>
          <button className={`reader-btn has-text ${chapter.hasLiked ? 'active' : ''}`} title="Bình chọn" onClick={handleToggleLike}>
            <Heart size={20} fill={chapter.hasLiked ? 'url(#purple-ombre)' : 'none'} stroke={chapter.hasLiked ? 'url(#purple-ombre)' : 'currentColor'} />
            <span>{formatNumber(chapter.likeCount || 0)}</span>
          </button>
          <button className="reader-btn has-text" title="Bình luận" onClick={() => setShowComments(true)}>
            <MessageCircle size={20} />
            <span>{formatNumber(commentCount)}</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="reader-progress-bar" style={{ width: `${scrollProgress}%` }} />

        {/* TOC Popover */}
        {showToc && (
          <div className="reader-toc-popover" ref={tocRef} onClick={(e) => e.stopPropagation()}>
            <div className="toc-popover-header justify-center">
              <span className="text-sm font-medium text-secondary opacity-70 uppercase tracking-wider">Bảng mục lục</span>
            </div>
            <div className="toc-popover-list">
              {story ? (
                story.chapters.map((c) => (
                  <button
                    key={c.id}
                    className={`toc-popover-item ${c.slug === chapter.slug ? "active" : ""}`}
                    onClick={() => {
                      setShowToc(false);
                      navigate(`/story/${slug}/chapter/${c.slug}`);
                    }}
                  >
                    {c.title}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center"><span className="spinner"></span></div>
              )}
            </div>
          </div>
        )}

        {/* Settings Popover */}
        {showSettings && (
          <div className="reader-settings-popover" ref={settingsRef}>
            <div className="settings-row">
              <span className="settings-label">Cỡ chữ</span>
              <div className="settings-controls">
                <button className="settings-btn" onClick={decreaseFontSize}>A-</button>
                <button className="settings-btn" onClick={increaseFontSize}>A+</button>
              </div>
            </div>
            <div className="settings-row">
              <span className="settings-label">Nền</span>
              <div className="settings-controls">
                <button className={`settings-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>Sáng</button>
                <button className={`settings-btn ${theme === 'sepia' ? 'active' : ''}`} onClick={() => setTheme('sepia')}>Vàng</button>
                <button className={`settings-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>Tối</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="reader-container fade-in" style={{ fontSize: `${fontSize}px` }}>
        <h1 className="chapter-title">{chapter.title}</h1>
        
        <div
          className="chapter-content"
          dangerouslySetInnerHTML={{
            __html: chapter.content
              .replace(/&nbsp;/g, ' ')
              .replace(/\u00A0/g, ' ')
              .split('\n')
              .filter(p => p.trim() !== '')
              .map(p => `<p>${p}</p>`)
              .join(''),
          }}
        />
      </div>

      {/* Bottom Actions */}
      <div className="reader-bottom-actions" onClick={(e) => e.stopPropagation()}>
        {chapter.nextChapterSlug ? (
          <button className="btn-next-chapter" onClick={() => navigate(`/story/${slug}/chapter/${chapter.nextChapterSlug}`)}>
            Đọc phần tiếp theo
          </button>
        ) : (
          <button className="btn-next-chapter disabled">
            Đã đến chương mới nhất
          </button>
        )}
        
        <div className="reader-action-icons">
          <button 
            className="action-btn" 
            onClick={(e) => {
              e.stopPropagation();
              if (!isAuthenticated) {
                toast.error('Vui lòng đăng nhập để thêm vào thư viện');
                return;
              }
              setIsLibraryDropdownOpen(true);
            }}
          >
            <Plus size={18} /> Thêm
          </button>
          <button className={`action-btn ${chapter.hasLiked ? 'liked' : ''}`} onClick={handleToggleLike}>
            <Heart size={18} fill={chapter.hasLiked ? 'url(#purple-ombre)' : 'none'} stroke={chapter.hasLiked ? 'url(#purple-ombre)' : 'currentColor'} /> Bình chọn
          </button>
          
          <button className="action-btn icon-only" onClick={handleCopyLink} title="Sao chép liên kết">
            <LinkIcon size={18} />
          </button>
          <button className="action-btn icon-only" onClick={() => setShowComments(true)} title="Bình luận">
            <MessageCircle size={18} />
          </button>
        </div>
      </div>

      {/* Comments Sidebar */}
      {showComments && createPortal(
        <CommentSidebar 
          chapterId={chapter?.id || 0}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          isPinned={isCommentPinned}
          onTogglePin={() => setIsCommentPinned(!isCommentPinned)}
          width={commentSidebarWidth}
          onWidthChange={setCommentSidebarWidth}
        />,
        document.body
      )}

      {chapter && (
        <ReportModal 
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="CHAPTER"
          targetId={chapter.id}
        />
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
                    const inList = list.stories?.some((s: any) => s.id === story?.id);
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
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }} onClick={() => setNewListIsPublic(!newListIsPublic)}>
                  <input 
                    type="checkbox" 
                    checked={newListIsPublic} 
                    readOnly
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Công khai (mọi người có thể xem)</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button 
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-main)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                    onClick={() => {
                      setIsCreatingNewList(false);
                      setNewListStr("");
                    }}
                  >
                    Hủy
                  </button>
                  <button 
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      background: 'var(--primary-color, #8b5cf6)',
                      color: '#fff',
                      border: 'none',
                      cursor: newListStr.trim() ? 'pointer' : 'not-allowed',
                      opacity: newListStr.trim() ? 1 : 0.5,
                      fontSize: '0.85rem',
                      fontWeight: 500
                    }}
                    disabled={!newListStr.trim() || createReadingListMutation.isPending}
                    onClick={() => {
                      if (newListStr.trim()) {
                        createReadingListMutation.mutate({ name: newListStr.trim(), isPublic: newListIsPublic });
                      }
                    }}
                  >
                    {createReadingListMutation.isPending ? 'Đang tạo...' : 'Tạo mới'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
