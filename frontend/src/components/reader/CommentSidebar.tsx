import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, MessageCircle, Pin, PinOff, MoreHorizontal } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { ReportModal } from '../ui/ReportModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import './CommentSidebar.css';

interface Comment {
  id: number;
  userId: number;
  userName: string;
  displayName?: string;
  avatarUrl?: string | null;
  content: string;
  likeCount: number;
  createdAt: string;
  replies: Comment[];
  paragraphHash?: string | null;
}

interface CommentSidebarProps {
  chapterId: number;
  isOpen: boolean;
  onClose: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  width?: number;
  setWidth?: (width: number) => void;
  onWidthChange?: (width: number) => void;
  paragraphHash?: string | null;
  paragraphText?: string | null;
  onClearParagraphFilter?: () => void;
}

export const CommentSidebar: React.FC<CommentSidebarProps> = ({ 
  chapterId, 
  isOpen, 
  onClose,
  isPinned = false,
  onTogglePin,
  width = 400,
  onWidthChange,
  paragraphHash = null,
  paragraphText = null
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; userName: string } | null>(null);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  
  const [isParagraphExpanded, setIsParagraphExpanded] = useState(false);

  useEffect(() => {
    setIsParagraphExpanded(false);
  }, [paragraphHash]);

  const getCleanedParagraphText = (html: string | null): string => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return (temp.textContent || temp.innerText || "").replace(/\s+/g, ' ').trim();
  };
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [openMenuCommentId, setOpenMenuCommentId] = useState<number | null>(null);
  const [reportCommentId, setReportCommentId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !onWidthChange) return;
      const newWidth = Math.max(300, Math.min(800, window.innerWidth - e.clientX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', chapterId],
    queryFn: () => api.get(`/chapters/${chapterId}/comments`).then(res => res.data),
    enabled: isOpen,
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId, paragraphHash }: { content: string, parentId?: number, paragraphHash?: string | null }) => {
      const res = await api.post(`/chapters/${chapterId}/comments`, { content, parentId, paragraphHash });
      return res.data;
    },
    onSuccess: () => {
      setNewComment('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['comments', chapterId] });
    },
    onError: (err) => {
      console.error(err);
      alert('Không thể gửi bình luận. Có thể bạn chưa đăng nhập hoặc đã xảy ra lỗi.');
    }
  });

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number, content: string }) => {
      const res = await api.put(`/chapters/${chapterId}/comments/${id}`, { content });
      return res.data;
    },
    onSuccess: () => {
      setEditingCommentId(null);
      queryClient.invalidateQueries({ queryKey: ['comments', chapterId] });
    },
    onError: () => alert('Không thể cập nhật bình luận.')
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/chapters/${chapterId}/comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', chapterId] });
    },
    onError: () => alert('Không thể xóa bình luận.')
  });

  const handleSubmit = () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để bình luận.");
      return;
    }
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ 
      content: newComment, 
      parentId: replyTo?.id,
      paragraphHash: replyTo ? null : paragraphHash
    });
  };

  const filteredComments = comments ? (
    paragraphHash 
      ? comments.filter(c => c.paragraphHash === paragraphHash)
      : comments
  ) : [];

  if (!isOpen) return null;

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

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className="reader-comment-item-container">
      <div className="reader-comment-item">
        {/* Commenter avatars are hidden as per request 6 */}
        <div className="reader-comment-bubble">
          <div className="reader-comment-author-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="reader-comment-author">{comment.displayName || comment.userName}</span>
              <span className="reader-comment-time" style={{ marginLeft: '8px' }}>
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setOpenMenuCommentId(openMenuCommentId === comment.id ? null : comment.id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 4px' }}
              >
                <MoreHorizontal size={16} />
              </button>
              {openMenuCommentId === comment.id && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  zIndex: 10,
                  overflow: 'hidden',
                  minWidth: '120px'
                }}>
                  {user?.username === comment.userName && (
                    <>
                      <button 
                        style={{ width: '100%', padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem' }}
                        onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content); setOpenMenuCommentId(null); }}
                      >
                        Chỉnh sửa
                      </button>
                      <button 
                        style={{ width: '100%', padding: '8px 16px', background: 'transparent', border: 'none', color: '#ef4444', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem' }}
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Xác nhận xóa',
                            message: 'Bạn có chắc chắn muốn xóa bình luận này?',
                            onConfirm: () => deleteCommentMutation.mutate(comment.id)
                          });
                          setOpenMenuCommentId(null);
                        }}
                      >
                        Xóa
                      </button>
                    </>
                  )}
                  {user?.username !== comment.userName && (
                    <button 
                      style={{ width: '100%', padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem' }}
                      onClick={() => {
                        if (!isAuthenticated) {
                          alert("Vui lòng đăng nhập để báo cáo.");
                          return;
                        }
                        setReportCommentId(comment.id);
                        setOpenMenuCommentId(null);
                      }}
                    >
                      Báo cáo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="reader-comment-content-row">
            {editingCommentId === comment.id ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  value={editCommentText}
                  onChange={(e) => setEditCommentText(e.target.value)}
                  style={{ width: '100%', minHeight: '60px', background: 'var(--bg-darker)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px', borderRadius: '4px', fontSize: '0.85rem' }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditingCommentId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>Hủy</button>
                  <button onClick={() => updateCommentMutation.mutate({ id: comment.id, content: editCommentText })} disabled={updateCommentMutation.isPending || !editCommentText.trim()} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Lưu</button>
                </div>
              </div>
            ) : (
              <p className="reader-comment-text">{comment.content}</p>
            )}
            <button 
              className="reader-comment-action-btn"
              onClick={() => setReplyTo({ id: isReply ? (replyTo?.id || comment.id) : comment.id, userName: comment.userName })}
            >
              Trả lời
            </button>
          </div>
        </div>
      </div>
      
      {!isReply && comment.replies && comment.replies.length > 0 && (
        <div className="reader-comment-replies">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`comment-sidebar-overlay ${isPinned ? 'pinned' : ''}`} 
      onClick={isPinned ? undefined : onClose}
      style={isPinned ? { pointerEvents: 'none' } : {}}
    >
      <div 
        className="comment-sidebar" 
        onClick={e => e.stopPropagation()}
        style={{ width: `${width}px`, pointerEvents: 'auto' }}
        ref={sidebarRef}
      >
        {isPinned && (
          <div 
            className="comment-sidebar-resizer" 
            onMouseDown={() => setIsResizing(true)}
          />
        )}

        <div className="comment-sidebar-header">
          <h3>Bình luận</h3>
          <div className="flex items-center gap-2">
            {onTogglePin && (
              <button 
                className="close-sidebar-btn pin-sidebar-btn" 
                onClick={onTogglePin}
                title={isPinned ? "Bỏ ghim" : "Ghim bình luận"}
              >
                {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
              </button>
            )}
            <button className="close-sidebar-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Selected Paragraph Filter Banner */}
        {paragraphHash && (
          <div className="paragraph-filter-indicator" style={{
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {paragraphText && (() => {
              const decodedText = getCleanedParagraphText(paragraphText);
              return (
                <div 
                  onClick={() => setIsParagraphExpanded(!isParagraphExpanded)}
                  style={{
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.45',
                    position: 'relative'
                  }}
                >
                  <p style={{
                    margin: 0,
                    display: isParagraphExpanded ? 'block' : '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontStyle: 'italic',
                    color: 'var(--text-muted)'
                  }}>
                    "{decodedText}"
                  </p>
                  {decodedText.length > 80 && (
                    <span style={{ 
                      color: 'var(--primary-color)', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      display: 'block',
                      marginTop: '4px',
                      textAlign: 'right'
                    }}>
                      {isParagraphExpanded ? 'Thu gọn' : 'Xem thêm'}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <div className="comment-list-container">
          {isLoading ? (
            <p className="text-center text-secondary">Đang tải...</p>
          ) : filteredComments && filteredComments.length > 0 ? (
            filteredComments.map(comment => renderComment(comment))
          ) : (
            <div className="text-center text-secondary mt-8">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>Chưa có bình luận nào.</p>
              {paragraphHash ? (
                <p className="text-sm mt-1">Hãy là người đầu tiên bình luận về đoạn này!</p>
              ) : (
                <p className="text-sm mt-1">Hãy là người đầu tiên chia sẻ cảm nghĩ!</p>
              )}
            </div>
          )}
        </div>

        <div className="comment-input-area">
          {replyTo && (
            <div className="replying-to-indicator">
              <span>Đang trả lời <strong>{replyTo.userName}</strong></span>
              <button className="cancel-reply-btn" onClick={() => setReplyTo(null)}>
                <X size={16} />
              </button>
            </div>
          )}
          <textarea
            className="comment-textarea"
            placeholder={isAuthenticated ? "Viết bình luận của bạn..." : "Vui lòng đăng nhập để bình luận..."}
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            disabled={!isAuthenticated || addCommentMutation.isPending}
          />
          <div className="comment-input-actions">
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleSubmit}
              disabled={!isAuthenticated || !newComment.trim() || addCommentMutation.isPending}
              isLoading={addCommentMutation.isPending}
            >
              Gửi bình luận
            </Button>
          </div>
        </div>
      </div>
      
      {reportCommentId && (
        <ReportModal 
          isOpen={!!reportCommentId}
          onClose={() => setReportCommentId(null)}
          targetType="COMMENT"
          targetId={reportCommentId}
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
