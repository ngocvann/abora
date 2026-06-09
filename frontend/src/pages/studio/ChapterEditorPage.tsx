import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, MoreHorizontal, Eye, ChevronDown } from 'lucide-react';
import { getImageUrl } from '../../utils/image';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './Studio.css';

interface Chapter {
  id: number;
  title: string;
  chapterNumber: number;
  slug: string;
  content: string;
  status: string;
}

export const ChapterEditorPage: React.FC = () => {
  const { storyId, chapterId } = useParams<{ storyId: string; chapterId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = chapterId !== 'new';
  const isLoadedRef = useRef(false);

  const [currentChapterId, setCurrentChapterId] = useState(chapterId);
  if (chapterId !== currentChapterId) {
    setCurrentChapterId(chapterId);
    isLoadedRef.current = false;
  }
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING' | 'ERROR'>('SAVED');
  const [initializedChapterId, setInitializedChapterId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [wordCount, setWordCount] = useState(0);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const tocRef = useRef<HTMLDivElement>(null);

  // Auto calculate word count
  useEffect(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Thay thế toàn bộ ký tự khoảng trắng lạ của Quill thành khoảng trắng thông thường
    text = text.replace(/\u00a0/g, ' ').replace(/&nbsp;/g, ' ');
    
    const cleanText = text.trim();
    if (cleanText === '') {
      setWordCount(0);
    } else {
      const words = cleanText.split(/\s+/);
      setWordCount(words.length);
    }
  }, [content]);

  const { data: chapter, isLoading } = useQuery({
    queryKey: ['chapter', storyId, chapterId],
    queryFn: async () => {
      const { data } = await api.get(`/stories/${storyId}/chapters/${chapterId}`);
      return data as Chapter;
    },
    enabled: isEditMode,
    gcTime: 0 // Prevent stale cache from showing empty content on remount
  });

  // Fetch chapters list for TOC and auto-calculating chapter number
  const { data: chapters } = useQuery({
    queryKey: ['management-chapters', storyId],
    queryFn: async () => {
      const { data } = await api.get(`/stories/${storyId}/chapters/management`);
      return data;
    },
    enabled: !!storyId
  });

  // Set form data when chapter is loaded
  useEffect(() => {
    if (isEditMode && chapter && initializedChapterId !== chapterId) {
      setTitle(chapter.title || '');
      setContent(chapter.content || '');
      setChapterNumber(chapter.chapterNumber);
      setStatus(chapter.status as 'DRAFT' | 'PUBLISHED');
      setInitializedChapterId(chapterId || null);
      
      // Wait for state updates to propagate before enabling autosave
      const timer = setTimeout(() => {
        isLoadedRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    } else if (!isEditMode && initializedChapterId !== 'new') {
      // Switch to create mode - reset all form states to avoid carrying over content from previously edited chapter
      setTitle('');
      setContent('');
      const nextNum = chapters && chapters.length > 0 ? chapters[chapters.length - 1].chapterNumber + 1 : 1;
      setChapterNumber(nextNum);
      setStatus('DRAFT');
      setInitializedChapterId('new');
      
      isLoadedRef.current = false;
      const timer = setTimeout(() => {
        isLoadedRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chapter, isEditMode, chapterId, initializedChapterId, chapters]);

  // Kiểm tra xem có sự thay đổi nào so với dữ liệu gốc trên server hay không
  const hasChanges = chapter ? (title !== chapter.title || content !== chapter.content) : false;



  // Fetch story details for header info (title, cover)
  const { data: story } = useQuery({
    queryKey: ['management-story', storyId],
    queryFn: async () => {
      const { data } = await api.get(`/stories/management/${storyId}`);
      return data;
    },
    enabled: !!storyId
  });

  const editorPageTitle = story 
    ? `Viết truyện: ${title || 'Chưa đặt tiêu đề'} - ${story.title} - Abora`
    : 'Viết truyện - Abora';
  useDocumentTitle(editorPageTitle);

  useEffect(() => {
    if (!isEditMode && chapters) {
      setChapterNumber(chapters.length > 0 ? chapters[chapters.length - 1].chapterNumber + 1 : 1);
    }
  }, [isEditMode, chapters]);

  // Handle scroll to show/hide navbar and adjust editor header top position
  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        document.documentElement.style.setProperty('--navbar-height', `${navbar.getBoundingClientRect().height}px`);
      }
    };
    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);

    const handleScroll = () => {
      if (window.scrollY > 40) {
        document.body.classList.add('editor-scrolled');
      } else {
        document.body.classList.remove('editor-scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', updateNavbarHeight);
      window.removeEventListener('scroll', handleScroll);
      document.body.classList.remove('editor-scrolled');
    };
  }, []);

  // Handle clicking outside more menu to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle clicking outside TOC dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tocRef.current && !tocRef.current.contains(e.target as Node)) {
        setIsTocOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Auto Save Effect
  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (status === 'PUBLISHED') return; // Không tự động lưu khi chương đã được đăng tải để tác giả chủ động bấm "Đăng các thay đổi"
    if (!title && !content) return; // Do not auto-save empty drafts

    // Chỉ tự động lưu nếu tiêu đề hoặc nội dung có sự thay đổi so với dữ liệu gốc tải về
    if (chapter && title === chapter.title && content === chapter.content) {
      return;
    }

    setSaveStatus('SAVING');
    const delayDebounceFn = setTimeout(async () => {
      try {
        const payload = {
          title: title || 'Chưa đặt tiêu đề',
          chapterNumber,
          content: content || '',
          status: 'DRAFT' as const
        };

        if (currentChapterId === 'new') {
          const { data } = await api.post(`/stories/${storyId}/chapters`, payload);
          queryClient.setQueryData(['chapter', storyId, data.id.toString()], data);
          setInitializedChapterId(data.id.toString()); 
          setCurrentChapterId(data.id.toString());
          queryClient.invalidateQueries({ queryKey: ['management-chapters', storyId] });
          navigate(`/studio/story/${storyId}/chapters/${data.id}`, { replace: true });
        } else {
          await api.put(`/stories/${storyId}/chapters/${currentChapterId}`, payload);
          queryClient.setQueryData(['chapter', storyId, currentChapterId], (oldData: any) => ({
             ...oldData,
             title: payload.title,
             content: payload.content,
             status: payload.status,
             chapterNumber: payload.chapterNumber
          }));
          queryClient.invalidateQueries({ queryKey: ['management-chapters', storyId] });
        }
        setSaveStatus('SAVED');
      } catch (error) {
        console.error('Lỗi tự động lưu:', error);
        setSaveStatus('ERROR');
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(delayDebounceFn);
  }, [title, content, currentChapterId, storyId, chapterNumber, navigate, queryClient, chapter]);

  const saveMutation = useMutation({
    mutationFn: async (status: 'DRAFT' | 'PUBLISHED') => {
      const payload = {
        title,
        chapterNumber,
        content,
        status
      };
      
      const isCurrentlyEdit = currentChapterId !== 'new';
      if (isCurrentlyEdit) {
        return api.put(`/stories/${storyId}/chapters/${currentChapterId}`, payload);
      } else {
        return api.post(`/stories/${storyId}/chapters`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-chapters', storyId] });
      navigate(`/studio/story/${storyId}/chapters`);
    }
  });

  const handleSave = (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title || !content) return alert('Vui lòng nhập tiêu đề và nội dung.');
    saveMutation.mutate(status);
  };

  const handlePreview = () => {
    if (!story) return;
    const isCurrentlyEdit = currentChapterId !== 'new';
    if (isCurrentlyEdit && chapter?.slug) {
      window.open(`/story/${storyId}-${story.slug}/chapter/${chapter.slug}`, '_blank');
    } else {
      window.open(`/story/${storyId}-${story.slug}`, '_blank');
    }
  };

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [2, 3, false] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image', 'clean']
    ],
  };


  const displayHeaderTitle = title 
    ? title.toUpperCase()
    : `CHƯƠNG ${chapterNumber}: CHƯA ĐẶT TIÊU ĐỀ`;

  if (isEditMode && ((isLoading && !chapter) || initializedChapterId !== chapterId)) {
    return (
      <div className="editor-page-wrapper flex justify-center items-center" style={{ minHeight: '100vh', paddingTop: 'var(--navbar-height, 56px)' }}>
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <span className="spinner"></span>
          <span className="text-sm font-medium">Đang tải bản thảo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page-wrapper">
      {/* Sticky Top Bar */}
      <div className="editor-sticky-header">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(`/studio/story/${storyId}/chapters`)} className="px-2 btn-pill" title="Quay lại">
            <ArrowLeft size={20} />
          </Button>

          {story && (
            <img
              src={getImageUrl(story.coverImageUrl, 'cover', story.title)}
              alt={story.title}
              className="editor-cover-thumbnail"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getImageUrl('', 'cover', story.title);
              }}
            />
          )}

          <div 
            className="flex flex-col text-left editor-header-details" 
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setIsTocOpen(!isTocOpen); }}
            ref={tocRef}
          >
            <div className="flex items-center gap-1" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              <span className="story-title-mini">{story ? story.title : 'Đang tải...'}</span>
              <ChevronDown size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
            </div>
            
            <span className="font-bold text-[1.05rem] chapter-title-mini" style={{ color: 'var(--text-main)', marginTop: '2px', marginBottom: '2px' }}>
              {displayHeaderTitle}
            </span>

            {isTocOpen && (
              <div className="chapter-toc-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="chapter-toc-header">Danh sách chương</div>
                <div className="chapter-toc-list">
                  {chapters && chapters.map((ch: any) => (
                    <div 
                      key={ch.id} 
                      className={`chapter-toc-item ${ch.id.toString() === currentChapterId ? 'active' : ''}`}
                      onClick={() => {
                        setIsTocOpen(false);
                        navigate(`/studio/story/${storyId}/chapters/${ch.id}`);
                      }}
                    >
                      <span className="chapter-toc-title">{ch.title || `${ch.chapterNumber}`}</span>
                      {ch.status === 'DRAFT' && <span className="chapter-toc-draft-badge">Nháp</span>}
                    </div>
                  ))}
                  {(!chapters || chapters.length === 0) && (
                    <div className="chapter-toc-empty">Chưa có chương nào</div>
                  )}
                </div>
                <div className="chapter-toc-footer">
                  <button 
                    className="chapter-toc-add-btn"
                    onClick={() => {
                      setIsTocOpen(false);
                      navigate(`/studio/story/${storyId}/chapters/new`);
                    }}
                  >
                    + Thêm chương mới
                  </button>
                </div>
              </div>
            )}

            <div className="editor-status-main">
              {status === 'PUBLISHED' ? (
                <div className="editor-status-draft-info">
                  <span>Đã đăng tải</span>
                  <span className="editor-word-count">({wordCount} từ)</span>
                </div>
              ) : (
                <>
                  <div className="editor-status-draft-info">
                    <span>Bản thảo</span>
                    <span className="editor-word-count">({wordCount} từ)</span>
                  </div>
                  <span className="editor-status-dot-separator">•</span>
                  <div className="editor-save-status">
                    {saveStatus === 'SAVED' && (
                      <span style={{ color: 'rgba(16, 185, 129, 0.85)', fontWeight: 500 }}>Đã lưu</span>
                    )}
                    {saveStatus === 'SAVING' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span className="spinner-sm" style={{ borderColor: 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1) rgba(255, 255, 255, 0.1)' }}></span> Đang lưu...
                      </span>
                    )}
                    {saveStatus === 'ERROR' && (
                      <span style={{ color: 'rgba(239, 68, 68, 0.85)', fontWeight: 500 }}>Lỗi tự động lưu</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {status === 'PUBLISHED' ? (
          <div className="editor-actions">
            <Button 
              variant="outline" 
              className="px-4 btn-pill btn-secondary-editor" 
              title="Xem trước"
              onClick={handlePreview}
              disabled={!story}
            >
              <Eye size={16} style={{ marginRight: '6px' }} /> Xem trước
            </Button>
            <Button 
              variant="primary" 
              className="px-4 btn-pill btn-primary-editor"
              onClick={() => handleSave('PUBLISHED')}
              disabled={!hasChanges}
              isLoading={saveMutation.isPending && saveMutation.variables === 'PUBLISHED'}
              style={{ 
                boxShadow: hasChanges ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
                opacity: hasChanges ? 1 : 0.5
              }}
            >
              Đăng các Thay Đổi
            </Button>
            <Button 
              variant="outline" 
              className="px-4 btn-pill btn-secondary-editor"
              onClick={() => navigate(`/studio/story/${storyId}/chapters`)}
            >
              Bỏ qua
            </Button>
            <div style={{ position: 'relative' }} ref={moreMenuRef}>
              <Button 
                variant="ghost" 
                className="px-2 btn-pill btn-more-editor"
                onClick={(e) => { e.stopPropagation(); setIsMoreMenuOpen(!isMoreMenuOpen); }}
                title="Tùy chọn khác"
              >
                <MoreHorizontal size={20} />
              </Button>
              {isMoreMenuOpen && (
                <div className="chapter-dropdown-menu" style={{ marginTop: '8px' }}>
                  <button 
                    className="chapter-dropdown-item mobile-only-item"
                    onClick={(e) => { e.stopPropagation(); setIsMoreMenuOpen(false); handlePreview(); }}
                    disabled={!story}
                  >
                    Xem trước
                  </button>
                  <button 
                    className="chapter-dropdown-item mobile-only-item"
                    onClick={(e) => { e.stopPropagation(); setIsMoreMenuOpen(false); navigate(`/studio/story/${storyId}/chapters`); }}
                  >
                    Bỏ qua
                  </button>
                  <button 
                    className="chapter-dropdown-item"
                    onClick={(e) => { e.stopPropagation(); setIsMoreMenuOpen(false); navigate(`/studio/story/${storyId}/chapters`); }}
                  >
                    Bảng mục lục
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="editor-actions">
            <Button 
              variant="outline" 
              className="px-4 btn-pill btn-secondary-editor" 
              title="Xem trước"
              onClick={handlePreview}
              disabled={!story}
            >
              <Eye size={16} style={{ marginRight: '6px' }} /> Xem trước
            </Button>
            <Button 
              variant="outline" 
              className="px-4 btn-pill btn-secondary-editor"
              onClick={() => handleSave('DRAFT')}
              isLoading={saveMutation.isPending && saveMutation.variables === 'DRAFT'}
            >
              Lưu nháp
            </Button>
            <Button 
              variant="primary" 
              className="px-4 btn-pill btn-primary-editor"
              onClick={() => handleSave('PUBLISHED')}
              isLoading={saveMutation.isPending && saveMutation.variables === 'PUBLISHED'}
              style={{ boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}
            >
              Đăng tải
            </Button>
            <div style={{ position: 'relative' }} ref={moreMenuRef}>
              <Button 
                variant="ghost" 
                className="px-2 btn-pill btn-more-editor"
                onClick={(e) => { e.stopPropagation(); setIsMoreMenuOpen(!isMoreMenuOpen); }}
                title="Tùy chọn khác"
              >
                <MoreHorizontal size={20} />
              </Button>
              {isMoreMenuOpen && (
                <div className="chapter-dropdown-menu" style={{ marginTop: '8px' }}>
                  <button 
                    className="chapter-dropdown-item mobile-only-item"
                    onClick={(e) => { e.stopPropagation(); setIsMoreMenuOpen(false); handlePreview(); }}
                    disabled={!story}
                  >
                    Xem trước
                  </button>
                  <button 
                    className="chapter-dropdown-item mobile-only-item"
                    onClick={(e) => { e.stopPropagation(); setIsMoreMenuOpen(false); handleSave('DRAFT'); }}
                  >
                    Lưu nháp
                  </button>
                  <button 
                    className="chapter-dropdown-item"
                    onClick={(e) => { e.stopPropagation(); setIsMoreMenuOpen(false); navigate(`/studio/story/${storyId}/chapters`); }}
                  >
                    Bảng mục lục
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area - Distraction Free */}
      <div className="chapter-editor-container fade-in-opacity">
        <input 
          type="text" 
          className="editor-title-input" 
          placeholder="Nhập tiêu đề chương..." 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <ReactQuill 
          theme="snow" 
          value={content} 
          onChange={setContent} 
          modules={modules}
          placeholder="Bắt đầu viết những dòng đầu tiên..."
          className="distraction-free-editor"
        />
      </div>
    </div>
  );
};
