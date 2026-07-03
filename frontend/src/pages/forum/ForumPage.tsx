import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Heart, MessageSquare, MessagesSquare, Send, Award, MoreHorizontal, MoreVertical, Flag, Edit3, Trash2, X, Image as ImageIcon, Globe, Lock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore, isAdmin } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ReportModal } from '../../components/ui/ReportModal';
import { AdminDeleteReasonModal } from '../../components/ui/AdminDeleteReasonModal';
import { getImageUrl } from '../../utils/image';
import './ForumPage.css';

interface Post {
  id: number;
  userId: number;
  userUsername: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  content: string;
  type: 'FORUM' | 'PERSONAL';
  mediaUrl?: string | null;
  mediaType?: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
}

const formatRelativeTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng`;
    
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return '';
  }
};

export const ForumPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [newPostContent, setNewPostContent] = useState('');
  const [postType, setPostType] = useState<'FORUM' | 'PERSONAL'>('FORUM');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const [openCommentsPostId, setOpenCommentsPostId] = useState<number | null>(null);

  // Hashtag & Textarea Expand & Show More state
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedHashtag = searchParams.get('tag') || null;

  const setSelectedHashtag = (tag: string | null) => {
    if (tag) {
      setSearchParams({ tag });
    } else {
      setSearchParams({});
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewPostContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMediaUrl(res.data.url);
      setMediaType(res.data.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE');
    } catch {
      alert('Tải tập tin đa phương tiện thất bại.');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const renderPostContentWithHashtags = (content: string) => {
    const words = content.split(/(\s+)/);
    return words.map((word, idx) => {
      if (word.startsWith('#') && word.length > 1) {
        return (
          <span
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedHashtag(word.trim());
            }}
            style={{
              color: 'var(--primary-color, #a855f7)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {word}
          </span>
        );
      }
      return word;
    });
  };

  const renderPostText = (post: Post) => {
    const isExpanded = expandedPosts[post.id];
    const limit = 250;
    
    if (post.content.length <= limit || isExpanded) {
      return (
        <div className="post-content" onClick={() => navigate(`/post/${post.id}`)}>
          {renderPostContentWithHashtags(post.content)}
          {isExpanded && post.content.length > limit && (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                setExpandedPosts(prev => ({ ...prev, [post.id]: false }));
              }}
              style={{
                color: 'var(--primary-color, #a855f7)',
                fontWeight: 600,
                marginLeft: '6px',
                cursor: 'pointer'
              }}
            >
              Thu gọn
            </span>
          )}
        </div>
      );
    }
    
    const truncated = post.content.substring(0, limit);
    return (
      <div className="post-content" onClick={() => navigate(`/post/${post.id}`)}>
        {renderPostContentWithHashtags(truncated)}...
        <span 
          onClick={(e) => {
            e.stopPropagation();
            setExpandedPosts(prev => ({ ...prev, [post.id]: true }));
          }}
          style={{
            color: 'var(--primary-color, #a855f7)',
            fontWeight: 600,
            marginLeft: '6px',
            cursor: 'pointer'
          }}
        >
          Xem thêm
        </span>
      </div>
    );
  };

  // Post Edit state
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ type: 'STORY' | 'CHAPTER' | 'COMMENT' | 'USER' | 'POST', id: number } | null>(null);

  const [adminDeleteModal, setAdminDeleteModal] = useState<{
    isOpen: boolean;
    type: 'POST' | 'COMMENT';
    id: number;
  } | null>(null);

  // Fetch Forum Posts
  const { data: postsData, isLoading, isError } = useQuery({
    queryKey: ['forum-posts'],
    queryFn: async () => {
      const res = await api.get('/posts/forum?size=50');
      return res.data;
    }
  });

  const posts: Post[] = postsData?.content || [];

  const filteredPosts = posts.filter((post) => {
    if (!selectedHashtag) return true;
    return post.content.toLowerCase().includes(selectedHashtag.toLowerCase());
  });

  // Create Post Mutation
  const createPostMutation = useMutation({
    mutationFn: async ({ content, type, mediaUrl, mediaType }: { content: string; type: 'FORUM' | 'PERSONAL'; mediaUrl?: string | null; mediaType?: string | null }) => {
      const res = await api.post('/posts', { content, type, mediaUrl, mediaType });
      return res.data;
    },
    onSuccess: () => {
      setNewPostContent('');
      setMediaUrl(null);
      setMediaType(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-timeline'] });
    },
    onError: () => {
      alert('Không thể đăng bài viết. Vui lòng thử lại.');
    }
  });

  // Toggle Like Mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: number) => {
      await api.post(`/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-timeline'] });
    }
  });

  // ─── Delete Post Mutation ──────────────────────────────────────────────────
  const deletePostMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const url = reason ? `/posts/${id}?reason=${encodeURIComponent(reason)}` : `/posts/${id}`;
      await api.delete(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-timeline'] });
    },
    onError: () => alert('Không thể xóa bài viết.')
  });

  // ─── Update Post Mutation ──────────────────────────────────────────────────
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number, content: string }) => {
      const res = await api.put(`/posts/${id}`, { content });
      return res.data;
    },
    onSuccess: () => {
      setEditingPostId(null);
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
    onError: () => alert('Không thể cập nhật bài viết.')
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !mediaUrl) return;
    createPostMutation.mutate({ content: newPostContent, type: postType, mediaUrl, mediaType });
  };

  const handleAuthorClick = (username: string) => {
    if (window.location.pathname === `/${username}`) {
      window.location.reload();
    } else {
      navigate(`/${username}`);
    }
  };

  // Fetch top authors
  const { data: topAuthors = [] } = useQuery<any[]>({
    queryKey: ['top-authors'],
    queryFn: async () => {
      const res = await api.get('/stories/leaderboard/authors');
      return res.data.slice(0, 5);
    }
  });

  return (
    <div className="forum-page fade-in">
      <div className="forum-container">
        
        {/* Main Feed Column */}
        <div className="forum-main">
          
          {/* Post Creator (only for authenticated users) */}
          {user && (
            <div className="glass-card post-creator">
              <div className="creator-header">
                <img 
                  src={getImageUrl(user.avatarUrl, 'avatar', user.displayName || user.username)} 
                  alt="Avatar" 
                  className="creator-avatar" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', user.displayName || user.username);
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                    {user.displayName}
                  </span>
                  {/* Scope Switcher (Thanh gạt) */}
                  <div className="post-type-toggle-switch">
                    <button
                      type="button"
                      className={`toggle-option ${postType === 'FORUM' ? 'active' : ''}`}
                      onClick={() => setPostType('FORUM')}
                    >
                      <Globe size={13} />
                      <span>Công khai</span>
                    </button>
                    <button
                      type="button"
                      className={`toggle-option ${postType === 'PERSONAL' ? 'active' : ''}`}
                      onClick={() => setPostType('PERSONAL')}
                    >
                      <Lock size={13} />
                      <span>Cá nhân</span>
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreatePost} style={{ marginTop: '0.75rem' }}>
                <textarea
                  ref={textareaRef}
                  placeholder={postType === 'FORUM' ? "Chia sẻ ý kiến với cộng đồng..." : "Viết dòng nhật ký cá nhân..."}
                  value={newPostContent}
                  onChange={handleTextareaChange}
                  maxLength={2000}
                  rows={1}
                />

                {/* Media Preview */}
                {mediaUrl && (
                  <div style={{ position: 'relative', marginTop: '0.5rem', marginBottom: '0.5rem', width: 'fit-content' }}>
                    {mediaType === 'VIDEO' ? (
                      <video src={mediaUrl} controls style={{ maxHeight: '180px', borderRadius: '8px' }} />
                    ) : (
                      <img src={mediaUrl} alt="Preview" style={{ maxHeight: '180px', borderRadius: '8px', objectFit: 'cover' }} />
                    )}
                    <button
                      type="button"
                      onClick={() => { setMediaUrl(null); setMediaType(null); }}
                      style={{
                        position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)',
                        border: 'none', color: '#fff', borderRadius: '50%', width: 22, height: 22,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="creator-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    title="Đính kèm Ảnh/Video"
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={isUploadingMedia}
                    style={{
                      background: mediaUrl ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${mediaUrl ? '#a855f7' : 'rgba(255, 255, 255, 0.12)'}`,
                      color: mediaUrl ? '#d8b4fe' : 'rgba(255, 255, 255, 0.8)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isUploadingMedia ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                  </button>
                  <input
                    type="file"
                    ref={mediaInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="publish-btn"
                    disabled={createPostMutation.isPending || (!newPostContent.trim() && !mediaUrl)}
                  >
                    {createPostMutation.isPending ? (
                      <><Loader2 className="animate-spin mr-2" size={16} /> Đang đăng...</>
                    ) : (
                      'Đăng bài'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <h2 className="feed-title" style={{ display: 'flex', alignItems: 'center' }}>
            <MessagesSquare size={24} style={{ color: '#a855f7', marginRight: '16px' }} />
            Thảo luận cộng đồng
          </h2>

          {selectedHashtag && (
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'rgba(168, 85, 247, 0.15)', 
                border: '1px solid rgba(168, 85, 247, 0.3)', 
                borderRadius: '20px', 
                padding: '6px 14px', 
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                color: '#d8b4fe'
              }}
            >
              <span>Đang lọc theo: <strong>{selectedHashtag}</strong></span>
              <button 
                onClick={() => setSelectedHashtag(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#ef4444', 
                  cursor: 'pointer', 
                  fontSize: '1rem', 
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 className="animate-spin text-primary inline" size={36} />
              <p style={{ marginTop: '1rem', color: 'rgba(255, 255, 255, 0.5)' }}>Đang tải bài viết...</p>
            </div>
          ) : isError ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger-color)' }}>
              Có lỗi xảy ra khi tải bài đăng diễn đàn. Vui lòng tải lại trang.
            </div>
          ) : filteredPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255, 255, 255, 0.4)' }}>
              {selectedHashtag ? 'Không tìm thấy bài viết nào chứa hashtag này.' : 'Chưa có cuộc thảo luận nào. Hãy là người đầu tiên khơi nguồn ý tưởng!'}
            </div>
          ) : (
            <div className="posts-feed">
              {filteredPosts.map((post) => (
                <div key={post.id} className="glass-card post-card">
                  
                  {/* Post Author Info */}
                  <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div 
                      className="author-info" 
                      onClick={() => handleAuthorClick(post.userUsername)} 
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    >
                      <img 
                        src={getImageUrl(post.userAvatarUrl, 'avatar', post.userDisplayName || post.userUsername)} 
                        alt={post.userDisplayName} 
                        className="author-avatar" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', post.userDisplayName || post.userUsername);
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="author-name hover-link">{post.userDisplayName}</span>
                          <span 
                            style={{ 
                              fontSize: '0.7rem', 
                              padding: '1px 6px', 
                              borderRadius: '8px', 
                              background: post.type === 'PERSONAL' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                              color: post.type === 'PERSONAL' ? '#93c5fd' : '#d8b4fe',
                              border: `1px solid ${post.type === 'PERSONAL' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)'}` 
                            }}
                          >
                            {post.type === 'PERSONAL' ? 'Nhật ký' : 'Diễn đàn'}
                          </span>
                        </div>
                        <span className="author-username">@{post.userUsername}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="post-time">{formatRelativeTime(post.createdAt)}</span>
                      {user && (
                        <div style={{ position: 'relative' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenMenuPostId(openMenuPostId === post.id ? null : post.id); }}
                            onBlur={() => setTimeout(() => setOpenMenuPostId(null), 150)}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                          >
                            <MoreVertical size={18} />
                          </button>
                          {openMenuPostId === post.id && (
                            <div style={{ position: 'absolute', right: 0, top: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.25rem', zIndex: 10, minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {user.username === post.userUsername && (
                                <>
                                  <button 
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPostId(post.id); setEditPostContent(post.content); setOpenMenuPostId(null); }}
                                    style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.5rem', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                  >
                                    <Edit3 size={14} /> Sửa
                                  </button>
                                  <button 
                                    onMouseDown={(e) => { 
                                      e.preventDefault(); 
                                      e.stopPropagation(); 
                                      setConfirmModal({
                                        isOpen: true,
                                        title: 'Xóa bài viết',
                                        message: 'Bạn có chắc chắn muốn xóa bài viết này?',
                                        onConfirm: () => deletePostMutation.mutate({ id: post.id })
                                      });
                                      setOpenMenuPostId(null); 
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.5rem', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                  >
                                    <Trash2 size={14} /> Xóa
                                  </button>
                                </>
                              )}
                              {user.username !== post.userUsername && (
                                <button 
                                  onMouseDown={(e) => { 
                                    e.preventDefault(); 
                                    e.stopPropagation(); 
                                    setReportTarget({ type: 'POST', id: post.id }); 
                                    setOpenMenuPostId(null); 
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.5rem', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  <Flag size={14} /> Báo cáo
                                </button>
                              )}
                              {isAdmin(user) && user.username !== post.userUsername && (
                                <>
                                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0.1rem 0' }} />
                                  <button
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setAdminDeleteModal({ isOpen: true, type: 'POST', id: post.id });
                                      setOpenMenuPostId(null);
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.5rem', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                  >
                                    <Trash2 size={14} /> Xóa (Admin)
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  {editingPostId === post.id ? (
                    <div style={{ margin: '0.75rem 0' }}>
                      <textarea
                        value={editPostContent}
                        onChange={(e) => setEditPostContent(e.target.value)}
                        style={{ width: '100%', minHeight: '80px', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', fontSize: '0.9rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <Button size="sm" variant="secondary" onClick={() => setEditingPostId(null)}>Hủy</Button>
                        <Button size="sm" variant="primary" disabled={updatePostMutation.isPending || !editPostContent.trim()} onClick={() => updatePostMutation.mutate({ id: post.id, content: editPostContent })}>Lưu</Button>
                      </div>
                    </div>
                  ) : (
                    renderPostText(post)
                  )}

                  {/* Post Media Attachment */}
                  {post.mediaUrl && (
                    <div className="post-media-container">
                      {post.mediaType === 'VIDEO' ? (
                        <video src={post.mediaUrl} controls />
                      ) : (
                        <img src={post.mediaUrl} alt="Post media" />
                      )}
                    </div>
                  )}

                  {/* Post Actions (Like, Comment count) */}
                  <div className="post-footer">
                    <button 
                      className={`action-btn like-btn ${post.isLikedByMe ? 'liked' : ''}`}
                      onClick={() => {
                        if (!user) {
                          alert('Vui lòng đăng nhập để thích bài viết.');
                          return;
                        }
                        toggleLikeMutation.mutate(post.id);
                      }}
                    >
                      <Heart size={18} fill={post.isLikedByMe ? '#ef4444' : 'none'} color={post.isLikedByMe ? '#ef4444' : 'currentColor'} />
                      <span>{post.likeCount}</span>
                    </button>

                    <button 
                      className="action-btn comment-btn"
                      onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                    >
                      <MessageSquare size={18} />
                      <span>{post.commentCount}</span>
                    </button>
                  </div>

                  {/* Comment Section Sub-component */}
                  {openCommentsPostId === post.id && (
                    <PostCommentsSection 
                      postId={post.id} 
                      postOwnerUsername={post.userUsername} 
                      onAdminDeleteComment={(commentId) => setAdminDeleteModal({ isOpen: true, type: 'COMMENT', id: commentId })}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Sidebar Column: Top Authors / Rules */}
        <div className="forum-sidebar">
          
          {/* Top Authors */}
          <div className="glass-card sidebar-widget">
            <h3 className="widget-title">
              <Award size={18} style={{ color: '#eab308', marginRight: '8px' }} />
              Tác giả nổi bật
            </h3>
            {topAuthors.length > 0 ? (
              <div className="authors-list">
                {topAuthors.map((author) => {
                  const authorId = author.id || author.authorId;
                  const username = author.username || author.authorUsername;
                  const displayName = author.displayName || author.authorDisplayName || username;
                  const avatarUrl = author.avatarUrl || author.authorAvatarUrl;

                  return (
                    <div 
                      key={authorId} 
                      className="author-item"
                      onClick={() => handleAuthorClick(username)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img 
                        src={getImageUrl(avatarUrl, 'avatar', displayName || username)} 
                        alt={displayName} 
                        className="item-avatar"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', displayName || username);
                        }}
                      />
                      <div className="item-info">
                        <span className="item-name hover-link">{displayName}</span>
                        <span className="item-sub">{author.followerCount || 0} người theo dõi</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="follow-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAuthorClick(username);
                        }}
                      >
                        Theo dõi
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-secondary">Chưa có thông tin tác giả.</p>
            )}
          </div>

          {/* Forum Rules */}
          <div className="glass-card sidebar-widget rules-widget">
            <h3 className="widget-title">Nội quy thảo luận</h3>
            <p className="rules-desc">
              Vui lòng giữ lịch sự, tôn trọng các thành viên khác. Không spam, quảng cáo trái phép hoặc đăng tải nội dung vi phạm tiêu chuẩn cộng đồng Abora.
            </p>
          </div>

        </div>

      </div>

      {reportTarget && (
        <ReportModal 
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText="Xác nhận"
          cancelText="Hủy"
          isDanger={true}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {adminDeleteModal && (
        <AdminDeleteReasonModal
          isOpen={adminDeleteModal.isOpen}
          itemType={adminDeleteModal.type}
          onClose={() => setAdminDeleteModal(null)}
          onConfirm={(reason) => {
            if (adminDeleteModal.type === 'POST') {
              deletePostMutation.mutate({ id: adminDeleteModal.id, reason });
            } else {
              api.delete(`/posts/comments/${adminDeleteModal.id}?reason=${encodeURIComponent(reason)}`).then(() => {
                queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
                queryClient.invalidateQueries({ queryKey: ['post-comments'] });
              });
            }
            setAdminDeleteModal(null);
          }}
        />
      )}
    </div>
  );
};


// ─── Sub-component to manage specific comments ──────────────────────────────
const PostCommentsSection: React.FC<{ postId: number, postOwnerUsername: string, onAdminDeleteComment: (commentId: number) => void }> = ({ postId, postOwnerUsername, onAdminDeleteComment }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string; username: string; isSubReply?: boolean } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [openMenuCommentId, setOpenMenuCommentId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ type: 'STORY' | 'CHAPTER' | 'COMMENT' | 'USER' | 'POST', id: number } | null>(null);

  // Fetch comments for this specific post
  const { data: comments = [], isLoading } = useQuery<any[]>({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const res = await api.get(`/posts/${postId}/comments`);
      return res.data;
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async (payload: { content: string; parentId?: number }) => {
      const res = await api.post(`/posts/${postId}/comments`, payload);
      return res.data;
    },
    onSuccess: () => {
      setCommentText('');
      setReplyText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-timeline'] });
    },
    onError: () => alert('Không thể gửi bình luận.')
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number, content: string }) => {
      const res = await api.put(`/posts/comments/${id}`, { content });
      return res.data;
    },
    onSuccess: () => {
      setEditingCommentId(null);
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    },
    onError: () => alert('Không thể cập nhật bình luận.')
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/posts/comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-timeline'] });
    },
    onError: () => alert('Không thể xóa bình luận.')
  });

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ content: commentText });
  };

  const handleSendReply = (e: React.FormEvent, targetParentId: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    addCommentMutation.mutate({ content: `@${replyingTo?.username} ${replyText}`, parentId: targetParentId });
  };

  const renderCommentContent = (content: string) => {
    if (content.startsWith('@')) {
      const firstSpaceIndex = content.indexOf(' ');
      if (firstSpaceIndex !== -1) {
        const mention = content.substring(0, firstSpaceIndex);
        const rest = content.substring(firstSpaceIndex);
        return (
          <>
            <span 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${mention.replace('@', '')}`);
              }} 
              style={{ color: '#93c5fd', fontWeight: 600, cursor: 'pointer', marginRight: '4px' }}
            >
              {mention}
            </span>
            {rest}
          </>
        );
      }
    }
    return content;
  };

  const renderComment = (comment: any, isReply = false) => {
    const isActiveReplyBox = replyingTo?.id === comment.id && !isReply;

    return (
      <div key={comment.id} className="comment-item-container" style={{ marginLeft: isReply ? '3rem' : '0', marginTop: isReply ? '0.2rem' : '0' }}>
        <div className="comment-item">
          <div onClick={() => navigate(`/${comment.userUsername}`)} style={{ cursor: 'pointer' }}>
            <img 
              src={getImageUrl(comment.userAvatarUrl, 'avatar', comment.userDisplayName || comment.userUsername)} 
              className="comment-avatar" 
              alt={comment.userDisplayName} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', comment.userDisplayName || comment.userUsername);
              }}
            />
          </div>
          <div className="comment-bubble" style={{ position: 'relative' }}>
            <div className="comment-author-header" style={{ paddingRight: '1.5rem' }}>
              <span 
                className="comment-author-name hover-link" 
                onClick={() => {
                  if (window.location.pathname === `/${comment.userUsername}`) {
                    window.location.reload();
                  } else {
                    navigate(`/${comment.userUsername}`);
                  }
                }}
              >
                {comment.userDisplayName}
              </span>
              <span className="comment-time">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>

            {editingCommentId === comment.id ? (
              <div style={{ margin: '0.4rem 0' }}>
                <textarea
                  value={editCommentText}
                  onChange={(e) => setEditCommentText(e.target.value)}
                  style={{ width: '100%', minHeight: '60px', padding: '0.4rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', fontSize: '0.85rem' }}
                />
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
                  <Button size="sm" variant="secondary" onClick={() => setEditingCommentId(null)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Hủy</Button>
                  <Button size="sm" variant="primary" disabled={updateCommentMutation.isPending || !editCommentText.trim()} onClick={() => updateCommentMutation.mutate({ id: comment.id, content: editCommentText })} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Lưu</Button>
                </div>
              </div>
            ) : (
              <p className="comment-text">{renderCommentContent(comment.content)}</p>
            )}

            {user && (
              <div style={{ position: 'absolute', right: '0.4rem', top: '0.4rem' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setOpenMenuCommentId(openMenuCommentId === comment.id ? null : comment.id); }}
                  onBlur={() => setTimeout(() => setOpenMenuCommentId(null), 150)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '0.1rem', display: 'flex', alignItems: 'center' }}
                >
                  <MoreHorizontal size={14} />
                </button>
                {openMenuCommentId === comment.id && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.2rem', zIndex: 10, minWidth: '90px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {user.username === comment.userUsername && (
                      <button 
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingCommentId(comment.id); setEditCommentText(comment.content); setOpenMenuCommentId(null); }}
                        style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', padding: '0.4rem 0.5rem', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <Edit3 size={12} /> Sửa
                      </button>
                    )}
                    {(user.username === comment.userUsername || user.username === postOwnerUsername) && (
                      <button 
                        onMouseDown={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          setConfirmModal({
                            isOpen: true,
                            title: 'Xóa bình luận',
                            message: 'Bạn có chắc chắn muốn xóa bình luận này?',
                            onConfirm: () => deleteCommentMutation.mutate(comment.id)
                          });
                          setOpenMenuCommentId(null); 
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', padding: '0.4rem 0.5rem', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <Trash2 size={12} /> Xóa
                      </button>
                    )}
                    {user.username !== comment.userUsername && (
                      <button 
                        onMouseDown={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          setReportTarget({ type: 'COMMENT', id: comment.id }); 
                          setOpenMenuCommentId(null); 
                        }}
                        style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', padding: '0.4rem 0.5rem', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <Flag size={12} /> Báo cáo
                      </button>
                    )}
                    {isAdmin(user) && user.username !== comment.userUsername && (
                      <>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0.1rem 0' }} />
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAdminDeleteComment(comment.id);
                            setOpenMenuCommentId(null);
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', padding: '0.4rem 0.5rem', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <Trash2 size={12} /> Xóa (Admin)
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {user && (
            <div style={{ paddingLeft: '0.5rem', marginTop: '0.3rem' }}>
              <button 
                onClick={() => {
                  setReplyingTo({ 
                    id: isReply ? comment.parentId : comment.id, 
                    name: comment.userDisplayName,
                    username: comment.userUsername,
                    isSubReply: isReply
                  });
                  setReplyText('');
                }}
                style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Trả lời
              </button>
            </div>
          )}
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map((reply: any) => renderComment(reply, true))}
          </div>
        )}
        {isActiveReplyBox && (
          <div style={{ marginLeft: '3rem', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <form 
              onSubmit={(e) => handleSendReply(e, comment.id)} 
              className="comment-input-wrapper" style={{ flex: 1, margin: 0 }}
            >
              <input
                type="text"
                placeholder={`Trả lời ${replyingTo?.name}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                maxLength={1000}
                autoFocus
                style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
              />
              <button
                type="submit"
                className="send-comment-btn"
                disabled={addCommentMutation.isPending || !replyText.trim()}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {addCommentMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="comments-section" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'rgba(255,255,255,0.5)' }}>
          <Loader2 className="animate-spin inline" size={16} /> Đang tải bình luận...
        </div>
      ) : (
        <>
          <div className="comments-list">
            {comments.map((comment) => renderComment(comment))}
          </div>

          {user ? (
            <form onSubmit={handleSendComment} className="comment-input-wrapper" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Viết bình luận của bạn..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={1000}
                style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.88rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
              />
              <button
                type="submit"
                className="send-comment-btn"
                disabled={addCommentMutation.isPending || !commentText.trim()}
                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {addCommentMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              </button>
            </form>
          ) : (
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
              Vui lòng đăng nhập để bình luận.
            </p>
          )}
        </>
      )}

      {reportTarget && (
        <ReportModal 
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText="Xác nhận"
          cancelText="Hủy"
          isDanger={true}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};
