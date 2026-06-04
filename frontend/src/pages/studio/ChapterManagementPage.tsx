import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useCallback } from 'react';
import { ArrowLeft, Menu, Eye, Heart, MessageCircle, MoreHorizontal, Edit2, X, Info } from 'lucide-react';
import { getImageUrl } from '../../utils/image';
import './Studio.css';

interface ChapterSummary {
  id: number;
  storyId: number;
  title: string;
  chapterNumber: number;
  status: string;
  wordCount: number;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

const formatChapterDate = (dateString?: string) => {
  if (!dateString) return 'Mới cập nhật';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Mới cập nhật';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `Th${month} ${day}, ${year}`;
};

interface StoryDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  status: string;
  visibility: string;
  ageRating: string;
  categories: { id: number; name: string; slug: string; description: string }[];
  tags: { id: number; name: string }[];
  publishedChapterCount?: number;
  draftChapterCount?: number;
}

const fetchChapters = async (storyId: string): Promise<ChapterSummary[]> => {
  const { data } = await api.get(`/stories/${storyId}/chapters/management`);
  return data;
};

const fetchStory = async (storyId: string): Promise<StoryDetail> => {
  const { data } = await api.get(`/stories/management/${storyId}`);
  return data;
};

const StoryDetailsForm: React.FC<{ story: StoryDetail; storyId: string }> = ({ story, storyId }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(story.title || "");
  const [description, setDescription] = useState(story.description || "");
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    hideCancel?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isDanger: false,
    hideCancel: true,
    onConfirm: () => {}
  });
  const [status, setStatus] = useState(story.status || "DRAFT");
  const [isCompleted, setIsCompleted] = useState(story.status === 'COMPLETED');
  const [visibility] = useState(story.visibility || "PUBLIC");
  const [ageRating, setAgeRating] = useState(story.ageRating || "EVERYONE");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    story.categories?.map((c) => c.id) || []
  );
  const [tags, setTags] = useState<string[]>(story.tags?.map((t) => t.name) || []);
  const [currentTagInput, setCurrentTagInput] = useState("");

  const isPublished = (story.publishedChapterCount ?? 0) > 0;

  useEffect(() => {
    if (story) {
      setTitle(story.title || "");
      setDescription(story.description || "");
      setStatus(story.status || "DRAFT");
      setIsCompleted(story.status === 'COMPLETED');
      setAgeRating(story.ageRating || "EVERYONE");
      setSelectedCategoryIds(story.categories?.map((c) => c.id) || []);
      setTags(story.tags?.map((t) => t.name) || []);
    }
  }, [story]);

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data;
    },
  });

  const toggleCategory = (id: number) => {
    if (selectedCategoryIds.includes(id)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((x) => x !== id));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, id]);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " ") {
      e.preventDefault();
      const newTag = currentTagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setCurrentTagInput("");
    } else if (
      e.key === "Backspace" &&
      currentTagInput === "" &&
      tags.length > 0
    ) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const updateStoryMutation = useMutation({
    mutationFn: async () => {
      let targetStatus = status;
      if (isCompleted) {
        targetStatus = 'COMPLETED';
      } else {
        const isPublished = (story.publishedChapterCount ?? 0) > 0;
        if (isPublished) {
          targetStatus = 'PUBLISHED';
        } else {
          targetStatus = status === 'HIDDEN' ? 'HIDDEN' : 'DRAFT';
        }
      }

      const payload = {
        title,
        description,
        categoryIds: selectedCategoryIds,
        tags,
        status: targetStatus,
        visibility,
        ageRating,
        contentWarning: null,
      };
      await api.put(`/stories/${storyId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["story", storyId] });
      setConfirmConfig({
        isOpen: true,
        title: "Thành công",
        message: "Đã cập nhật chi tiết truyện thành công!",
        isDanger: false,
        hideCancel: true,
        onConfirm: () => {}
      });
    },
    onError: (error: any) => {
      console.error("Lỗi khi cập nhật truyện:", error);
      setConfirmConfig({
        isOpen: true,
        title: "Lỗi hệ thống",
        message: "Lỗi khi cập nhật truyện: " + (error.response?.data?.message || error.message),
        isDanger: true,
        hideCancel: true,
        onConfirm: () => {}
      });
    },
  });

  const handleHideStory = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Xác nhận ẩn truyện",
      message: "Bạn có chắc chắn muốn ẩn truyện này không? Tất cả các chương đã đăng sẽ chuyển thành trạng thái bản thảo và truyện sẽ tạm ẩn khỏi tầm mắt độc giả.",
      isDanger: true,
      hideCancel: false,
      onConfirm: async () => {
        try {
          const payload = {
            title,
            description,
            categoryIds: selectedCategoryIds,
            tags,
            status: 'HIDDEN',
            visibility,
            ageRating,
            contentWarning: null,
          };
          await api.put(`/stories/${storyId}`, payload);
          setStatus('HIDDEN');
          queryClient.invalidateQueries({ queryKey: ["story", storyId] });
          queryClient.invalidateQueries({ queryKey: ["management-chapters", storyId] });
          
          setConfirmConfig({
            isOpen: true,
            title: "Thành công",
            message: "Truyện đã được ẩn thành công. Tất cả các chương đã đăng đã chuyển thành bản thảo.",
            hideCancel: true,
            onConfirm: () => {}
          });
        } catch (error: any) {
          console.error("Lỗi khi ẩn truyện:", error);
          setConfirmConfig({
            isOpen: true,
            title: "Lỗi hệ thống",
            message: "Lỗi khi ẩn truyện: " + (error.response?.data?.message || error.message),
            isDanger: true,
            hideCancel: true,
            onConfirm: () => {}
          });
        }
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategoryIds.length === 0) {
      setConfirmConfig({
        isOpen: true,
        title: "Thông báo",
        message: "Truyện phải thuộc ít nhất một thể loại cố định.",
        isDanger: true,
        hideCancel: true,
        onConfirm: () => {}
      });
      return;
    }
    updateStoryMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="text-left" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
      <div className="form-group">
        <label className="form-label">Tiêu đề truyện</label>
        <input
          type="text"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Mô tả truyện</label>
        <textarea
          className="form-textarea"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Giới thiệu truyện..."
        />
      </div>

      <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: '24px' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Trạng thái phát hành</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="story-status-tag">
            <span className="status-dot" style={{ 
              backgroundColor: !isPublished ? '#9ca3af' : '#10b981'
            }}></span>
            {!isPublished ? 'Chưa phát hành' : 'Đã phát hành'}
          </div>
          {isPublished && (
            <Button
              type="button"
              variant="outline"
              className="px-4 btn-pill"
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '4px 12px', fontSize: '0.8rem', height: 'auto' }}
              onClick={handleHideStory}
            >
              Ẩn truyện
            </Button>
          )}
        </div>
      </div>

      <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: '24px' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          Trạng Thái Truyện
          <span title="Đánh dấu khi tác phẩm đã viết xong toàn bộ" style={{ display: 'inline-flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.4)', cursor: 'help' }}>
            <Info size={14} />
          </span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: isCompleted ? '#a78bfa' : 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>
            Hoàn thành?
          </span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={isCompleted} 
              onChange={(e) => setIsCompleted(e.target.checked)} 
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Độ tuổi</label>
        <select
          className="form-select"
          value={ageRating}
          onChange={(e) => setAgeRating(e.target.value)}
        >
          <option value="EVERYONE">Mọi lứa tuổi (Everyone)</option>
          <option value="TEEN">Thiếu niên (13+)</option>
          <option value="MATURE">Trưởng thành (18+)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Thẻ Tag</label>
        <div className="tag-input-container">
          {tags.map((tag) => (
            <div key={tag} className="tag-chip">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="tag-remove-btn"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <input
            type="text"
            className="tag-input-field"
            value={currentTagInput}
            onChange={(e) => setCurrentTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Bấm Dấu Cách để thêm thẻ"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Thể loại <span style={{ color: "#ef4444", fontWeight: "bold" }}>*</span>
        </label>
        {selectedCategoryIds.length === 0 && (
          <div style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
            Vui lòng chọn ít nhất một thể loại.
          </div>
        )}
        <div className="category-grid">
          {categories.map((cat: any) => {
            const isSelected = selectedCategoryIds.includes(cat.id);
            return (
              <div
                key={cat.id}
                className={`category-chip-selectable ${isSelected ? "selected" : ""}`}
                onClick={() => toggleCategory(cat.id)}
                title={cat.description}
              >
                {cat.name}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="submit"
          variant="primary"
          isLoading={updateStoryMutation.isPending}
          disabled={selectedCategoryIds.length === 0}
        >
          Lưu Thay Đổi
        </Button>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.hideCancel ? "Đóng" : "Xác nhận"}
        cancelText="Hủy"
        hideCancel={confirmConfig.hideCancel}
        isDanger={confirmConfig.isDanger}
        onConfirm={() => {
          confirmConfig.onConfirm();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </form>
  );
};

export const ChapterManagementPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chapters");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chapterToDelete, setChapterToDelete] = useState<number | null>(null);
  const [chapterToTogglePublish, setChapterToTogglePublish] = useState<{ id: number; currentStatus: string } | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isDanger: false
  });

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const toggleDropdown = (chapterId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdownId(activeDropdownId === chapterId ? null : chapterId);
  };

  const togglePublishMutation = useMutation({
    mutationFn: async ({ chapterId, currentStatus }: { chapterId: number; currentStatus: string }) => {
      const { data: chapterDetail } = await api.get(`/stories/${storyId}/chapters/${chapterId}`);
      const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await api.put(`/stories/${storyId}/chapters/${chapterId}`, {
        title: chapterDetail.title,
        content: chapterDetail.content,
        chapterNumber: chapterDetail.chapterNumber,
        status: newStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-chapters', storyId] });
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
    },
    onError: (error: any) => {
      setAlertConfig({
        isOpen: true,
        title: "Lỗi hệ thống",
        message: "Lỗi khi thay đổi trạng thái đăng tải: " + (error.response?.data?.message || error.message),
        isDanger: true
      });
    }
  });

  const { data: story } = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => fetchStory(storyId as string),
    enabled: !!storyId
  });

  const { data: chapters, isLoading } = useQuery({
    queryKey: ['management-chapters', storyId],
    queryFn: () => fetchChapters(storyId as string),
    enabled: !!storyId,
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      await api.put(`/stories/${storyId}/chapters/reorder`, orderedIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-chapters', storyId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (chapterId: number) => {
      await api.delete(`/stories/${storyId}/chapters/${chapterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-chapters', storyId] });
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
    },
  });

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;
    const sourceIdx = result.source.index;
    const destIdx = result.destination.index;
    if (sourceIdx === destIdx) return;
    const reordered = Array.from(chapters || []);
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(destIdx, 0, moved);
    const orderedIds = reordered.map((c: any) => c.id);
    reorderMutation.mutate(orderedIds);
  }, [chapters, reorderMutation]);

  const handleDeleteChapter = (chapterId: number) => {
    setChapterToDelete(chapterId);
  };

  const handleConfirmDelete = () => {
    if (chapterToDelete !== null) {
      deleteMutation.mutate(chapterToDelete);
      setChapterToDelete(null);
    }
  };

  const handleConfirmTogglePublish = () => {
    if (chapterToTogglePublish) {
      togglePublishMutation.mutate({ chapterId: chapterToTogglePublish.id, currentStatus: chapterToTogglePublish.currentStatus });
      setChapterToTogglePublish(null);
    }
  };

  const handleCoverClick = () => {
    fileInputRef.current?.click();
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      try {
        await api.post(`/stories/${storyId}/cover`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        queryClient.invalidateQueries({ queryKey: ['story', storyId] });
        setAlertConfig({
          isOpen: true,
          title: "Thành công",
          message: "Tải ảnh bìa thành công!",
          isDanger: false
        });
      } catch (err: any) {
        setAlertConfig({
          isOpen: true,
          title: "Lỗi tải ảnh",
          message: "Lỗi khi tải ảnh bìa: " + (err.response?.data?.message || err.message),
          isDanger: true
        });
      }
    }
  };

  return (
    <div className="studio-container fade-in" style={{ paddingTop: '6px' }}>
      {/* Sub Header */}
      <div className="studio-sub-header" style={{ justifyContent: 'flex-start', gap: '16px', marginBottom: '1.25rem', paddingBottom: '0.75rem' }}>
        <Button
          variant="ghost"
          className="px-2"
          onClick={() => navigate("/studio")}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>Sửa Chi Tiết Truyện</h1>
      </div>

      <div className="create-story-layout">
        <div className="flex flex-col gap-6">

          <div className="cover-upload-wrapper">
            <img 
              src={getImageUrl(story?.coverImageUrl, 'cover', story?.title)} 
              alt="Cover" 
              className="cover-upload-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getImageUrl('', 'cover', story?.title);
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
            <button
              type="button"
              className="cover-edit-btn"
              onClick={handleCoverClick}
              title="Đổi ảnh bìa"
            >
              <Edit2 size={16} />
            </button>
          </div>
          
          <Button variant="primary" className="w-full" style={{ marginTop: '-12px' }} onClick={() => navigate(`/story/${story?.id}-${story?.slug}`)}>
            Xem trước
          </Button>
        </div>

        <div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem', marginTop: '0.75rem', textAlign: 'center' }}>{story?.title || 'Đang tải...'}</h1>
          <div className="studio-tabs" style={{ marginBottom: '1.25rem' }}>
            <button 
              className={`studio-tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Chi Tiết Truyện
            </button>
            <button 
              className={`studio-tab ${activeTab === 'chapters' ? 'active' : ''}`}
              onClick={() => setActiveTab('chapters')}
            >
              Bảng Mục Lục
            </button>
            <button 
              className={`studio-tab ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Ghi chú Truyện
            </button>
          </div>

          {activeTab === 'details' && story && (
            <StoryDetailsForm story={story} storyId={storyId as string} />
          )}

          {activeTab === 'notes' && (
            <div className="text-center p-12 glass-panel rounded-xl">
              <p className="text-secondary">Chức năng ghi chú đang được phát triển.</p>
            </div>
          )}

          {activeTab === 'chapters' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <Button onClick={() => navigate(`/studio/story/${storyId}/chapters/new`)} variant="primary" className="bg-[#ff5722] hover:bg-[#e64a19] text-white">
                  + Chương Mới
                </Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center p-8">
                  <span className="spinner"></span>
                </div>
              ) : chapters?.length === 0 ? (
                <div className="text-center">
                  <p className="text-secondary" style={{ margin: 0 }}>Truyện này chưa có chương nào.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="chapters">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          {chapters?.map((chapter: any, index: number) => (
                            <Draggable key={chapter.id} draggableId={String(chapter.id)} index={index}>
                              {(provided) => (
                                <div
                                  className="chapter-row-premium cursor-pointer"
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  onClick={(e) => {
                                    const isDragHandle = (e.target as HTMLElement).closest('.story-row-drag-handle');
                                    const isActions = (e.target as HTMLElement).closest('.chapter-row-actions');
                                    if (!isDragHandle && !isActions) {
                                      navigate(`/studio/story/${storyId}/chapters/${chapter.id}`);
                                    }
                                  }}
                                >
                                  <div className="story-row-drag-handle" {...provided.dragHandleProps}>
                                    <Menu size={20} />
                                  </div>
                                  <div className="chapter-row-info">
                                    <h3 className="chapter-row-title hover:text-[var(--primary-color)] transition-colors">
                                      {chapter.title || 'Chưa đặt tiêu đề'}
                                    </h3>
                                    <div className="chapter-row-meta mt-1">
                                      <span className={chapter.status === 'PUBLISHED' ? "chapter-status-published" : "chapter-status-draft"}>
                                        {chapter.status === 'PUBLISHED' ? 'Đã đăng tải' : 'Bản thảo'}
                                      </span>
                                      <span> - {formatChapterDate(chapter.publishedAt || chapter.createdAt || chapter.updatedAt)}</span>
                                      <span className="chapter-meta-divider"></span>
                                      <span className="chapter-meta-stat" title="Lượt xem">
                                        <Eye size={15} /> {chapter.viewCount || 0}
                                      </span>
                                      <span className="chapter-meta-stat" title="Lượt thích">
                                        <Heart size={15} /> {chapter.likeCount || 0}
                                      </span>
                                      <span className="chapter-meta-stat" title="Bình luận">
                                        <MessageCircle size={15} /> {chapter.commentCount || 0}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="chapter-row-actions">
                                    <div className="chapter-dropdown-wrapper">
                                      <button
                                        className="action-btn-icon-premium"
                                        onClick={(e) => toggleDropdown(chapter.id, e)}
                                        title="Tùy chọn"
                                      >
                                        <MoreHorizontal size={20} />
                                      </button>
                                      {activeDropdownId === chapter.id && (
                                        <div className="chapter-dropdown-menu">
                                          <button
                                            className="chapter-dropdown-item"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveDropdownId(null);
                                              navigate(`/story/${storyId}-${story?.slug}/chapter/${chapter.slug}`);
                                            }}
                                          >
                                            Xem trước
                                          </button>
                                          <button
                                            className="chapter-dropdown-item"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveDropdownId(null);
                                              setChapterToTogglePublish({ id: chapter.id, currentStatus: chapter.status });
                                            }}
                                          >
                                            {chapter.status === 'PUBLISHED' ? 'Ẩn chương' : 'Đăng tải'}
                                          </button>
                                          <button
                                            className="chapter-dropdown-item danger"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveDropdownId(null);
                                              handleDeleteChapter(chapter.id);
                                            }}
                                          >
                                            Xóa Chương
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={chapterToDelete !== null}
        title="Xóa chương truyện"
        message="Bạn có chắc chắn muốn xóa chương truyện này không? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setChapterToDelete(null)}
      />
      <ConfirmModal
        isOpen={chapterToTogglePublish !== null}
        title={chapterToTogglePublish?.currentStatus === 'PUBLISHED' ? "Ẩn chương truyện" : "Đăng tải chương"}
        message={chapterToTogglePublish?.currentStatus === 'PUBLISHED' 
          ? "Bạn có chắc chắn muốn ẩn chương này không? Khán giả sẽ không thể đọc được chương này nữa."
          : "Bạn có chắc chắn muốn đăng tải chương này không? Khán giả sẽ có thể đọc chương này ngay lập tức."}
        confirmText="Xác nhận"
        cancelText="Hủy"
        isDanger={false}
        onConfirm={handleConfirmTogglePublish}
        onCancel={() => setChapterToTogglePublish(null)}
      />
      <ConfirmModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText="Đóng"
        hideCancel={true}
        isDanger={alertConfig.isDanger}
        onConfirm={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        onCancel={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />
    </div>
  );
};
