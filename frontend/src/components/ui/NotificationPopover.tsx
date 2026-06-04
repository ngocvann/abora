import React, { useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquareReply, BookOpen, BookPlus, CheckCheck, Loader2, Info, UserPlus, Heart, Trash2, Ban } from 'lucide-react';
import api from '../../services/api';
import './NotificationPopover.css';

interface Notification {
  id: number;
  type: 'NEW_CHAPTER' | 'NEW_STORY' | 'COMMENT_REPLY' | 'SYSTEM_ALERT' | 'NEW_FOLLOWER' | 'LIKE_COMMENT' | 'LIKE_POST' | 'CONTENT_DELETED' | 'ACCOUNT_BANNED';
  message: string;
  entityType: string | null;
  entityId: number | null;
  actorId: number | null;
  read: boolean;
  createdAt: string;
  targetUrl: string | null;
}

interface UnreadCount {
  count: number;
}

const fetchNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get('/notifications');
  return data;
};

const fetchUnreadCount = async (): Promise<UnreadCount> => {
  const { data } = await api.get('/notifications/unread-count');
  return data;
};

const typeIcon = (type: Notification['type']) => {
  switch (type) {
    case 'SYSTEM_ALERT':  return <Info size={18} className="notif-icon system" />;
    case 'NEW_FOLLOWER':  return <UserPlus size={18} className="notif-icon user" />;
    case 'LIKE_COMMENT':
    case 'LIKE_POST':     return <Heart size={18} className="notif-icon heart" />;
    case 'CONTENT_DELETED': return <Trash2 size={18} className="notif-icon danger" />;
    case 'ACCOUNT_BANNED': return <Ban size={18} className="notif-icon danger" />;
    case 'COMMENT_REPLY': return <MessageSquareReply size={18} className="notif-icon reply" />;
    case 'NEW_CHAPTER':   return <BookOpen size={18} className="notif-icon chapter" />;
    case 'NEW_STORY':     return <BookPlus size={18} className="notif-icon story" />;
    default:              return <Bell size={18} className="notif-icon" />;
  }
};

const timeAgo = (dateStr: string): string => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
  return `${Math.floor(diff / 86400)} ngày`;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPopover: React.FC<Props> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: isOpen,
    staleTime: 30_000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000, // poll mỗi 60s
  });

  const markReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.setQueryData(['notifications-unread'], { count: 0 });
    },
  });

  // Khi mở popover → đánh dấu đã đọc sau 1.5s (UX tốt hơn)
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if ((unreadData?.count ?? 0) > 0) {
        markReadMutation.mutate();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isOpen, unreadData?.count]);

  // Click ngoài để đóng
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const unreadCount = unreadData?.count ?? 0;

  const handleNotifClick = (n: Notification) => {
    if (n.targetUrl) {
      navigate(n.targetUrl);
      onClose();
    }
  };

  return (
    <div className="notif-wrapper" ref={popoverRef}>
      {/* Bell trigger button */}
      <button
        className="icon-btn notif-bell-btn"
        title="Thông báo"
        onClick={(e) => {
          if (isOpen) {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Popover panel */}
      {isOpen && (
        <div className="notif-popover fade-in-fast">
          <div className="notif-header">
            <h3 className="notif-title">Thông báo</h3>
            {(unreadData?.count ?? 0) > 0 && !markReadMutation.isPending && (
              <button
                className="notif-mark-read-btn"
                onClick={() => markReadMutation.mutate()}
              >
                <CheckCheck size={15} /> Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notif-list">
            {isLoading ? (
              <div className="notif-empty">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : !notifications?.length ? (
              <div className="notif-empty">
                <Bell size={32} className="notif-empty-icon" />
                <p>Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? 'unread' : ''} ${n.targetUrl ? 'clickable' : ''}`}
                  onClick={() => handleNotifClick(n)}
                  style={{ cursor: n.targetUrl ? 'pointer' : 'default' }}
                >
                  <div className="notif-item-icon">{typeIcon(n.type)}</div>
                  <div className="notif-item-body">
                    <p className="notif-item-message">{n.message}</p>
                    <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                  </div>
                  {!n.read && <span className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};


