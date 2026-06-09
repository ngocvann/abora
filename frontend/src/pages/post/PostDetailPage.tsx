import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { 
  Heart, MessageSquare, MoreVertical, Edit3, Trash2, Flag, ArrowLeft, Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PostCommentsSection } from '../profile/ProfilePage';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ReportModal } from '../../components/ui/ReportModal';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/image';

interface Post {
  id: number;
  content: string;
  userUsername: string;
  userDisplayName: string;
  userAvatarUrl: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLikedByMe?: boolean;
}

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const postId = Number(id);

  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [reportTarget, setReportTarget] = useState<{ type: 'POST' | 'COMMENT', id: number } | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const { data: post, isLoading, isError } = useQuery<Post>({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await api.get(`/posts/${postId}`);
      return res.data;
    },
    enabled: !!postId,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/posts/${postId}/like`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const previousPost = queryClient.getQueryData<Post>(['post', postId]);
      
      if (previousPost) {
        queryClient.setQueryData<Post>(['post', postId], {
          ...previousPost,
          isLikedByMe: !previousPost.isLikedByMe,
          likeCount: previousPost.isLikedByMe ? previousPost.likeCount - 1 : previousPost.likeCount + 1
        });
      }
      return { previousPost };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.put(`/posts/${postId}`, { content });
      return res.data;
    },
    onSuccess: (data) => {
      setEditingPostId(null);
      queryClient.setQueryData(['post', postId], data);
      toast.success('Đã cập nhật bài viết');
    },
    onError: () => toast.error('Không thể cập nhật bài viết')
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: () => {
      toast.success('Đã xóa bài viết');
      navigate('/');
    },
    onError: () => toast.error('Không thể xóa bài viết')
  });

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

  const handleAuthorClick = (username: string) => {
    navigate(`/users/${username}`);
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
              navigate(`/forum?tag=${encodeURIComponent(tag)}`);
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

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (isError || !post) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl text-red-500 mb-4">Bài viết không tồn tại hoặc đã bị xóa.</h2>
        <Button onClick={() => navigate(-1)} variant="secondary">Quay lại</Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }} className="fade-in">
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={16} /> Quay lại
      </Button>

      <div className="glass-card post-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        {/* Post Header */}
        <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="post-author-info" onClick={() => handleAuthorClick(post.userUsername)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src={getImageUrl(post.userAvatarUrl, 'avatar', post.userDisplayName || post.userUsername)} 
              alt="Avatar" 
              className="creator-avatar" 
              style={{ width: '48px', height: '48px', borderRadius: '50%' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', post.userDisplayName || post.userUsername);
              }}
            />
            <div className="post-author-details">
              <span className="post-author-name" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{post.userDisplayName}</span>
              <span className="post-author-username" style={{ color: 'var(--text-secondary)' }}>@{post.userUsername}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="post-time">{formatRelativeTime(post.createdAt)}</span>
            {user && (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setOpenMenuPostId(openMenuPostId === post.id ? null : post.id); }}
                  onBlur={() => setTimeout(() => setOpenMenuPostId(null), 150)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '0.2rem' }}
                >
                  <MoreVertical size={20} />
                </button>
                {openMenuPostId === post.id && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.25rem', zIndex: 10, minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    {user.username === post.userUsername && (
                      <>
                        <button 
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPostId(post.id); setEditPostContent(post.content); setOpenMenuPostId(null); }}
                          style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.5rem', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <Edit3 size={16} /> Sửa
                        </button>
                        <button 
                          onMouseDown={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            setConfirmModal({
                              isOpen: true,
                              title: 'Xóa bài viết',
                              message: 'Bạn có chắc chắn muốn xóa bài viết này?',
                              onConfirm: () => deletePostMutation.mutate()
                            });
                            setOpenMenuPostId(null); 
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.5rem', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <Trash2 size={16} /> Xóa
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
                        style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.5rem', width: '100%', textAlign: 'left', borderRadius: '4px' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <Flag size={16} /> Báo cáo
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
          <div className="post-content" style={{ margin: '1rem 0' }}>
            <textarea
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
              className="post-composer-input"
              style={{ width: '100%', minHeight: '100px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '1rem', fontSize: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setEditingPostId(null)}>Hủy</Button>
              <Button variant="primary" disabled={updatePostMutation.isPending || !editPostContent.trim()} onClick={() => updatePostMutation.mutate(editPostContent)}>
                {updatePostMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="post-content" style={{ fontSize: '1.1rem', margin: '0.75rem 0', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {renderPostContentWithHashtags(post.content)}
          </div>
        )}

        {/* Interaction Bar */}
        <div className="post-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', gap: '1.5rem' }}>
          <button 
            className={`interaction-btn ${post.isLikedByMe ? 'liked' : ''}`} 
            onClick={() => toggleLikeMutation.mutate()}
            disabled={!user}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: post.isLikedByMe ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
          >
            <Heart size={20} fill={post.isLikedByMe ? 'currentColor' : 'none'} />
            <span>{post.likeCount}</span>
          </button>
          <button 
            className="interaction-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
          >
            <MessageSquare size={20} />
            <span>{post.commentCount}</span>
          </button>
        </div>

        {/* Comments Section */}
        <div style={{ marginTop: '2rem' }}>
          <PostCommentsSection postId={post.id} postOwnerUsername={post.userUsername} />
        </div>

      </div>

      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {reportTarget && (
        <ReportModal 
          isOpen={true} 
          onClose={() => setReportTarget(null)} 
          targetType={reportTarget.type} 
          targetId={reportTarget.id} 
        />
      )}
    </div>
  );
};

