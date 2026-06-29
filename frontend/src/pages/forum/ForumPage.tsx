import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Heart, MessageSquare, MessagesSquare, Send, Award, MoreHorizontal, MoreVertical, Flag, Edit3, Trash2, X } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ReportModal } from '../../components/ui/ReportModal';
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

  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewPostContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
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
              const tag = word.trim();
              setSelectedHashtag(selectedHashtag === tag ? null : tag);
            }}
            style={{
              color: 'var(--primary-color, #a855f7)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            className="hover:underline"
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
    mutationFn: async (content: string) => {
      const res = await api.post('/posts', { content, type: 'FORUM' });
      return res.data;
    },
    onSuccess: () => {
      setNewPostContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
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
      // Invalidate specific user timelines just in case
      queryClient.invalidateQueries({ queryKey: ['user-timeline'] });
    }
  });

  // ─── Delete Post Mutation ──────────────────────────────────────────────────
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
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
    if (!newPostContent.trim()) return;
    createPostMutation.mutate(newPostContent);
  };

  const handleAuthorClick = (username: string) => {
    if (window.location.pathname === `/${username}`) {
      window.location.reload();
    } else {
      navigate(`/${username}`);
    }
  };

  // Fetch top authors
  const { data: topAuthors = [], isLoading: isAuthorsLoading } = useQuery<any[]>({
    queryKey: ['top-authors'],
    queryFn: async () => {
      const res = await api.get('/stories/leaderboard/authors');
      return res.data.slice(0, 5); // Display top 5
    }
  });

  const handleFakeFollowToggle = (_authorId: number) => {
    // Tạm thời hiển thị alert hoặc call API follow sau
    if (!user) {
      alert('Vui lòng đăng nhập để theo dõi!');
      return;
    }
    // TODO: Connect to real follow API
    alert('Tính năng theo dõi đang được hoàn thiện!');
  };


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
                <span style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                  {user.displayName}
                </span>
              </div>
              <form onSubmit={handleCreatePost}>
                <textarea
                  ref={textareaRef}
                  placeholder="Hôm nay bạn muốn chia sẻ hay thảo luận điều gì?"
                  value={newPostContent}
                  onChange={handleTextareaChange}
                  maxLength={2000}
                  rows={1}
                />
                <div className="creator-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    className="publish-btn"
                    disabled={createPostMutation.isPending || !newPostContent.trim()}
                  >
                    {createPostMutation.isPending ? (
                      <><Loader2 className="animate-spin mr-2" size={16} /> Đang đăng...</>
                    ) : (
                      'Đăng thảo luận'
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
                  <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="post-author-info" onClick={() => handleAuthorClick(post.userUsername)}>
                      <img 
                        src={getImageUrl(post.userAvatarUrl, 'avatar', post.userDisplayName || post.userUsername)} 
                        alt="Avatar" 
                        className="creator-avatar" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', post.userDisplayName || post.userUsername);
                        }}
                      />
                      <div className="post-author-details">
                        <span className="post-author-name">{post.userDisplayName}</span>
                        <span className="post-author-username">@{post.userUsername}</span>
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
                                        onConfirm: () => deletePostMutation.mutate(post.id)
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
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  {editingPostId === post.id ? (
                    <div className="post-content" style={{ margin: '0.5rem 0' }}>
                      <textarea
                        value={editPostContent}
                        onChange={(e) => setEditPostContent(e.target.value)}
                        style={{ width: '100%', minHeight: '60px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '0.5rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <Button size="sm" variant="secondary" onClick={() => setEditingPostId(null)}>Hủy</Button>
                        <Button size="sm" variant="primary" disabled={updatePostMutation.isPending || !editPostContent.trim()} onClick={() => updatePostMutation.mutate({ id: post.id, content: editPostContent })}>
                          {updatePostMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    renderPostText(post)
                  )}

                  {/* Post Interactions */}
                  <div className="post-footer">
                    <button
                      className={`interaction-btn ${post.isLikedByMe ? 'liked' : ''}`}
                      onClick={() => toggleLikeMutation.mutate(post.id)}
                      disabled={!user}
                    >
                      <Heart size={18} fill={post.isLikedByMe ? 'currentColor' : 'none'} />
                      <span>{post.likeCount}</span>
                    </button>
                    <button
                      className="interaction-btn"
                      onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                    >
                      <MessageSquare size={18} />
                      <span>{post.commentCount}</span>
                    </button>
                  </div>

                  {/* Comments Collapsible Area */}
                  {openCommentsPostId === post.id && (
                    <PostCommentsSection postId={post.id} postOwnerUsername={post.userUsername} />
                  )}

                </div>
              ))}
            </div>
          )}

        </div>

        {/* Sidebar Column */}
        <div className="forum-sidebar">
          
          <div className="glass-card">
            <h3 className="sidebar-title">
              <Award className="mr-2 inline" size={20} style={{ verticalAlign: 'middle', color: '#eab308' }} />
              Tác giả nổi bật
            </h3>
            
            <div className="featured-authors-list">
              {isAuthorsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <Loader2 className="animate-spin text-gray-500" />
                </div>
              ) : topAuthors.length > 0 ? (
                topAuthors.map((author) => (
                  <div key={author.id} className="author-item">
                    <div className="author-info-wrapper" onClick={() => handleAuthorClick(author.username)}>
                      <img 
                        src={getImageUrl(author.avatarUrl, 'avatar', author.displayName || author.username)} 
                        alt={author.displayName} 
                        className="creator-avatar" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', author.displayName || author.username);
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="author-name">{author.displayName}</span>
                        <span className="author-bio-snippet" title={`Người theo dõi: ${author.followerCount || 0}`}>
                          {author.followerCount || 0} người theo dõi
                        </span>
                      </div>
                    </div>
                    <button
                      className={`follow-toggle-btn follow`}
                      onClick={() => handleFakeFollowToggle(author.id)}
                    >
                      Theo dõi
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>Chưa có tác giả nổi bật.</p>
              )}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nội quy thảo luận</h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              Vui lòng giữ lịch sự, tôn trọng các thành viên khác. Không spam, quảng cáo trái phép hoặc đăng tải nội dung nhạy cảm, độc hại. Hãy chung tay xây dựng cộng đồng văn minh tại Abora!
            </p>
          </div>

        </div>

      </div>
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
      {reportTarget && (
        <ReportModal 
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </div>
  );
};

// ─── Sub-component to manage specific comments ──────────────────────────────

interface PostCommentsSectionProps {
  postId: number;
  postOwnerUsername: string;
}

const PostCommentsSection: React.FC<PostCommentsSectionProps> = ({ postId, postOwnerUsername }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: number, name: string, username: string, isSubReply: boolean } | null>(null);
  
  const [openMenuCommentId, setOpenMenuCommentId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [reportTarget, setReportTarget] = useState<{ type: 'STORY' | 'CHAPTER' | 'COMMENT' | 'USER' | 'POST', id: number } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Fetch comments for this specific post
  const { data: comments = [], isLoading } = useQuery<any[]>({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const res = await api.get(`/posts/${postId}/comments`);
      return res.data;
    }
  });

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string, parentId?: number }) => {
      const payload: any = { content };
      if (parentId) {
        payload.parentId = parentId;
      }
      const res = await api.post(`/posts/${postId}/comments`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });

      setReplyText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-timeline'] });
    },
    onError: () => {
      alert('Không thể đăng bình luận.');
    }
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




  const handleSendReply = (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    let finalContent = replyText;
    if (replyingTo) {
      finalContent = `[@${replyingTo.username}:${replyingTo.name}] ${replyText}`;
    }
    
    addCommentMutation.mutate({ content: finalContent, parentId });
  };

  const renderCommentContent = (content: string) => {
    const match = content.match(/^\[@([^:]+):([^\]]+)\]\s*(.*)$/);
    if (match) {
      const username = match[1];
      const displayName = match[2];
      const text = match[3];
      return (
        <>
          <Link
            to={`/${username}`}
            onClick={(e) => e.stopPropagation()}
            style={{ color: '#a855f7', fontWeight: 600, cursor: 'pointer', marginRight: '0.25rem', textDecoration: 'none' }}
          >
            {displayName}
          </Link>
          {text}
        </>
      );
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
            alt="Avatar" 
            className="comment-avatar" 
            style={{ width: isReply ? '24px' : '32px', height: isReply ? '24px' : '32px' }} 
            onError={(e) => {
              (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', comment.userDisplayName || comment.userUsername);
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <div className="comment-bubble" style={{ position: 'relative' }}>
            <div className="comment-author-header" style={{ paddingRight: '1.5rem' }}>
                <span 
                  className="comment-author-name hover-link" 
                  style={{ cursor: 'pointer' }}
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
              <div style={{ marginTop: '0.5rem' }}>
                <textarea
                  value={editCommentText}
                  onChange={(e) => setEditCommentText(e.target.value)}
                  style={{ width: '100%', minHeight: '40px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', padding: '0.4rem', fontSize: '0.85rem' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                  <Button size="sm" variant="secondary" onClick={() => setEditingCommentId(null)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Hủy</Button>
                  <Button size="sm" variant="primary" disabled={updateCommentMutation.isPending || !editCommentText.trim()} onClick={() => updateCommentMutation.mutate({ id: comment.id, content: editCommentText })} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                    {updateCommentMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="comment-text">{renderCommentContent(comment.content)}</p>
            )}
             {/* Comment Menu */}
             {user && (
               <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                 <button 
                   onClick={(e) => { e.stopPropagation(); setOpenMenuCommentId(openMenuCommentId === comment.id ? null : comment.id); }}
                   onBlur={() => setTimeout(() => setOpenMenuCommentId(null), 150)}
                   style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '0.2rem' }}
                 >
                   <MoreHorizontal size={14} />
                 </button>
                 {openMenuCommentId === comment.id && (
                   <div style={{ position: 'absolute', right: 0, top: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.25rem', zIndex: 10, minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
    <div className="comments-section">
      
      {/* Comments List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}>
          <Loader2 className="animate-spin text-primary" size={20} />
        </div>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', padding: '1rem 0' }}>
          Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!
        </p>
      ) : (
        <div className="comments-list" style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '1rem' }}>
          {comments.map((comment) => renderComment(comment))}
        </div>
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
      {reportTarget && (
        <ReportModal 
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </div>
  );
};
