import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Minus, X, Send, Loader2, SquarePen, Image as ImageIcon, 
  MoreVertical, BellOff, UserX, Edit2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import type { ChatPartner } from '../../store/chatStore';
import { getImageUrl } from '../../utils/image';
import './FacebookChatWidget.css';

interface Message {
  id: number;
  senderId: number;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl?: string;
  recipientId: number;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  isRead: boolean;
  createdAt: string;
}

const SingleChatWindow: React.FC<{
  partner: ChatPartner;
  onMinimize: () => void;
  onClose: () => void;
}> = ({ partner, onMinimize, onClose }) => {
  const { user } = useAuthStore();
  const { nicknames, setNickname, mutedPartnerIds, toggleMutePartner, blockedUserIds, toggleBlockUser } = useChatStore();

  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const partnerNickname = (nicknames && typeof nicknames === 'object') ? nicknames[partner.id] : undefined;
  const displayPartnerName = partnerNickname || partner.displayName || partner.username;
  const isMuted = Array.isArray(mutedPartnerIds) ? mutedPartnerIds.includes(partner.id) : false;
  const isBlocked = Array.isArray(blockedUserIds) ? blockedUserIds.includes(partner.id) : false;

  // Fetch relationship (isFriend)
  const { data: relationship } = useQuery({
    queryKey: ['chat-relationship', partner.id],
    queryFn: async () => {
      const res = await api.get(`/chat/relationship/${partner.id}`);
      return res.data;
    },
    enabled: !!user,
  });

  // Fetch messages between current user and partner every 3 seconds
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['chat-messages', partner.id],
    queryFn: async () => {
      const res = await api.get(`/chat/messages/${partner.id}`);
      return res.data;
    },
    refetchInterval: 3000,
    enabled: !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: { recipientId: number; content?: string; mediaUrl?: string; mediaType?: string }) => {
      const res = await api.post('/chat/send', payload);
      return res.data;
    },
    onSuccess: () => {
      setText('');
      setMediaUrl(null);
      setMediaType(null);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', partner.id] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại!';
      toast.error(msg);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMediaUrl(res.data.url);
      setMediaType(res.data.mediaType);
    } catch (err: any) {
      toast.error('Tải tệp đính kèm thất bại');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) {
      toast.error('Bạn đã chặn người dùng này.');
      return;
    }
    if ((!text.trim() && !mediaUrl) || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      recipientId: partner.id,
      content: text.trim() || undefined,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
    });
  };

  const handleSaveNickname = () => {
    if (!relationship?.isFriend) {
      toast.error('Chỉ có thể đặt biệt danh khi cả 2 là bạn bè (cùng theo dõi nhau)!');
      setIsEditingNickname(false);
      return;
    }
    setNickname(partner.id, nicknameInput.trim());
    toast.success(nicknameInput.trim() ? `Đã đặt biệt danh: ${nicknameInput.trim()}` : 'Đã xóa biệt danh');
    setIsEditingNickname(false);
  };

  return (
    <div className="fb-chat-box">
      <div className="fb-chat-header">
        <div className="fb-chat-user" onClick={() => window.open(`/${partner.username}`, '_blank')}>
          <img
            src={getImageUrl(partner.avatarUrl, 'avatar', displayPartnerName)}
            alt={displayPartnerName}
            className="fb-chat-avatar"
          />
          <div className="fb-chat-user-info">
            <span className="fb-chat-name" title={displayPartnerName}>
              {displayPartnerName}
            </span>
            {partnerNickname && (
              <span className="fb-chat-subname">@{partner.username}</span>
            )}
          </div>
          {isMuted && (
            <span title="Đã tắt thông báo">
              <BellOff size={13} style={{ color: '#f59e0b', marginLeft: 4 }} />
            </span>
          )}
        </div>

        <div className="fb-chat-controls">
          <div style={{ position: 'relative' }}>
            <button
              className="fb-chat-btn"
              onClick={() => setShowOptions(!showOptions)}
              title="Tùy chọn đoạn chat"
            >
              <MoreVertical size={16} />
            </button>

            {showOptions && (
              <div className="fb-chat-options-menu">
                <button
                  className="fb-chat-option-item"
                  onClick={() => {
                    setShowOptions(false);
                    if (!relationship?.isFriend) {
                      toast.error('Chỉ có thể đặt biệt danh khi cả 2 là bạn bè (cùng theo dõi nhau)!');
                      return;
                    }
                    setNicknameInput(partnerNickname || '');
                    setIsEditingNickname(true);
                  }}
                >
                  <Edit2 size={14} />
                  <span>Đổi biệt danh</span>
                </button>

                <button
                  className="fb-chat-option-item"
                  onClick={() => {
                    toggleMutePartner(partner.id);
                    setShowOptions(false);
                    toast.success(isMuted ? 'Đã bật thông báo' : 'Đã tắt thông báo');
                  }}
                >
                  <BellOff size={14} />
                  <span>{isMuted ? 'Bật thông báo' : 'Tắt thông báo'}</span>
                </button>

                <button
                  className="fb-chat-option-item danger"
                  onClick={() => {
                    toggleBlockUser(partner.id);
                    setShowOptions(false);
                    toast.success(isBlocked ? 'Đã bỏ chặn người dùng' : 'Đã chặn người dùng');
                  }}
                >
                  <UserX size={14} />
                  <span>{isBlocked ? 'Bỏ chặn' : 'Chặn người dùng'}</span>
                </button>
              </div>
            )}
          </div>

          <button className="fb-chat-btn" onClick={onMinimize} title="Thu nhỏ">
            <Minus size={16} />
          </button>
          <button className="fb-chat-btn close" onClick={onClose} title="Đóng">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Editing Nickname Modal inside Chat Box */}
      {isEditingNickname && (
        <div className="fb-chat-nickname-box">
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Biệt danh cho {partner.displayName || partner.username}:</span>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input
              type="text"
              className="fb-chat-input"
              placeholder="Nhập biệt danh..."
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              autoFocus
            />
            <button className="fb-chat-send-btn" onClick={handleSaveNickname} style={{ width: 'auto', padding: '0 10px', borderRadius: '14px' }}>
              Lưu
            </button>
            <button className="fb-chat-btn close" onClick={() => setIsEditingNickname(false)}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Block Banner */}
      {isBlocked && (
        <div className="fb-chat-blocked-banner">
          <span>Bạn đã chặn người dùng này.</span>
        </div>
      )}

      <div className="fb-chat-body">
        {isLoading && messages.length === 0 ? (
          <div className="fb-chat-loading">
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : messages.length === 0 ? (
          <div className="fb-chat-empty">
            <p>Hãy gửi lời chào đến {displayPartnerName}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`fb-msg-row ${isMe ? 'me' : 'other'}`}>
                {!isMe && (
                  <img
                    src={getImageUrl(partner.avatarUrl, 'avatar', displayPartnerName)}
                    alt={displayPartnerName}
                    className="fb-msg-avatar"
                  />
                )}
                <div className="fb-msg-bubble-container">
                  {msg.mediaUrl && (
                    <div className="fb-msg-media">
                      {msg.mediaType === 'VIDEO' ? (
                        <video src={msg.mediaUrl} controls style={{ maxWidth: '200px', maxHeight: '180px', borderRadius: '10px' }} />
                      ) : (
                        <img src={msg.mediaUrl} alt="Message attachment" style={{ maxWidth: '200px', maxHeight: '180px', borderRadius: '10px', objectFit: 'cover' }} />
                      )}
                    </div>
                  )}
                  {msg.content && <div className="fb-msg-bubble">{msg.content}</div>}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview before sending */}
      {mediaUrl && (
        <div className="fb-chat-media-preview">
          {mediaType === 'VIDEO' ? (
            <video src={mediaUrl} controls style={{ maxHeight: '60px', borderRadius: '6px' }} />
          ) : (
            <img src={mediaUrl} alt="Preview" style={{ maxHeight: '60px', borderRadius: '6px', objectFit: 'cover' }} />
          )}
          <button className="fb-chat-media-clear" onClick={() => { setMediaUrl(null); setMediaType(null); }}>
            <X size={12} />
          </button>
        </div>
      )}

      <form className="fb-chat-footer" onSubmit={handleSend}>
        <button
          type="button"
          className="fb-chat-attach-btn"
          title="Đính kèm Ảnh/Video"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isBlocked}
        >
          {isUploading ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*,video/*"
          onChange={handleMediaUpload}
        />

        <input
          type="text"
          className="fb-chat-input"
          placeholder={isBlocked ? "Không thể gửi tin nhắn..." : "Nhập tin nhắn..."}
          value={text}
          disabled={isBlocked}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          type="submit"
          className="fb-chat-send-btn"
          disabled={(!text.trim() && !mediaUrl) || sendMessageMutation.isPending || isBlocked}
        >
          {sendMessageMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};

export const FacebookChatWidget: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    activeChats, minimizeChat, expandChat, closeChat, setTotalUnreadCount, 
    openChat, isDockVisible, setIsDockVisible 
  } = useChatStore();

  // New Chat window state
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Vertical Drag & Drop state
  const [dockBottomPx, setDockBottomPx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHideBtn, setShowHideBtn] = useState(false);
  const dragStartYRef = useRef<number>(0);
  const initialBottomRef = useRef<number>(20);
  const longPressTimerRef = useRef<any>(null);

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    dragStartYRef.current = clientY;
    initialBottomRef.current = dockBottomPx ?? (window.innerWidth <= 600 ? 85 : 20);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    const deltaY = dragStartYRef.current - clientY;
    const newBottom = Math.max(10, Math.min(window.innerHeight - 100, initialBottomRef.current + deltaY));
    setDockBottomPx(newBottom);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleDragMove(e.clientY);
    };
    const onMouseUp = () => {
      if (isDragging) handleDragEnd();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) handleDragMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => {
      if (isDragging) handleDragEnd();
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  const handleTouchStartLongPress = (clientY: number) => {
    handleDragStart(clientY);
    longPressTimerRef.current = setTimeout(() => {
      setShowHideBtn(true);
    }, 450);
  };

  const handleTouchEndLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  // Poll total unread count
  const { data: unreadData } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: async () => {
      const res = await api.get('/chat/unread-count');
      return res.data;
    },
    refetchInterval: 5000,
    enabled: !!user,
  });

  // Search users query for New Message box
  const { data: searchedUsers = [], isLoading: isSearchingUsers } = useQuery<any[]>({
    queryKey: ['chat-user-search', userSearchQuery],
    queryFn: async () => {
      if (!userSearchQuery.trim()) {
        const res = await api.get('/chat/conversations');
        return res.data.map((c: any) => ({
          id: c.userId,
          username: c.username,
          displayName: c.displayName,
          avatarUrl: c.avatarUrl
        }));
      }
      const res = await api.get(`/users/search?q=${encodeURIComponent(userSearchQuery.trim())}`);
      return res.data;
    },
    enabled: !!user && isNewChatOpen,
  });

  useEffect(() => {
    if (unreadData && typeof unreadData.unreadCount === 'number') {
      setTotalUnreadCount(unreadData.unreadCount);
    }
  }, [unreadData, setTotalUnreadCount]);

  if (!user) return null;

  const openChats = activeChats.filter((c) => !c.isMinimized);
  const minimizedChats = activeChats.filter((c) => c.isMinimized);

  return (
    <div className="fb-chat-widget-container">
      {/* Active Expanded Chat Windows */}
      <div className="fb-chat-windows-row">
        {/* New Chat Window (Image 4) */}
        {isNewChatOpen && (
          <div className="fb-chat-box fb-new-chat-box">
            <div className="fb-chat-header">
              <span className="fb-chat-name">Tin nhắn mới</span>
              <button className="fb-chat-btn close" onClick={() => setIsNewChatOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="fb-new-chat-to-row">
              <span className="fb-new-chat-to-label">Đến:</span>
              <input
                type="text"
                className="fb-new-chat-input"
                placeholder="Nhập tên hoặc @username..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="fb-new-chat-results">
              {isSearchingUsers ? (
                <div className="fb-chat-loading">
                  <Loader2 className="animate-spin" size={18} />
                </div>
              ) : searchedUsers.length === 0 ? (
                <div className="fb-chat-empty">
                  <p>Không tìm thấy người dùng phù hợp.</p>
                </div>
              ) : (
                searchedUsers.map((u: any) => (
                  <div
                    key={u.id}
                    className="fb-new-chat-user-item"
                    onClick={() => {
                      openChat({ id: u.id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl });
                      setIsNewChatOpen(false);
                      setUserSearchQuery('');
                    }}
                  >
                    <img
                      src={getImageUrl(u.avatarUrl, 'avatar', u.displayName || u.username)}
                      alt={u.displayName}
                      className="fb-new-chat-user-avatar"
                    />
                    <div className="fb-new-chat-user-info">
                      <span className="fb-new-chat-user-name">{u.displayName || u.username}</span>
                      <span className="fb-new-chat-user-username">@{u.username}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {openChats.map((chat) => (
          <SingleChatWindow
            key={chat.user.id}
            partner={chat.user}
            onMinimize={() => minimizeChat(chat.user.id)}
            onClose={() => closeChat(chat.user.id)}
          />
        ))}
      </div>

      {/* Minimized Floating Chat Bubbles & Action Dock (Supports Vertical Drag & Drop) */}
      {isDockVisible && (
        <div
          className={`fb-chat-bubbles-col ${isDragging ? 'dragging' : ''}`}
          style={dockBottomPx !== null ? { bottom: `${dockBottomPx}px` } : undefined}
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onTouchStart={(e) => {
            if (e.touches.length > 0) handleTouchStartLongPress(e.touches[0].clientY);
          }}
          onTouchEnd={handleTouchEndLongPress}
        >
          {/* Hide Minus Button (Revealed on Desktop hover & Mobile long-press) */}
          <button
            className={`fb-dock-hide-minus-btn ${showHideBtn ? 'visible' : ''}`}
            title="Ẩn bong bóng tin nhắn (Bấm icon Tin nhắn trên thanh điều hướng để hiện lại)"
            onClick={(e) => {
              e.stopPropagation();
              setIsDockVisible(false);
            }}
          >
            <Minus size={14} />
          </button>

          {/* Floating New Chat Circular Action Button */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className="fb-chat-new-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsNewChatOpen((v) => !v);
              }}
              title="Tin nhắn mới"
            >
              <SquarePen size={18} />
            </button>
            <span className="sparkle-star" style={{ top: '-4px', left: '-4px', width: '9px', height: '9px', animationDelay: '0s', zIndex: 10 }}></span>
            <span className="sparkle-star" style={{ bottom: '-2px', right: '-4px', width: '11px', height: '11px', animationDelay: '0.7s', zIndex: 10 }}></span>
            <span className="sparkle-star" style={{ top: '4px', left: '40%', width: '8px', height: '8px', animationDelay: '1.4s', zIndex: 10 }}></span>
          </div>

          {minimizedChats.map((chat) => (
            <div key={chat.user.id} className="fb-chat-bubble-wrapper">
              <div
                className="fb-chat-bubble-avatar"
                onClick={(e) => {
                  e.stopPropagation();
                  expandChat(chat.user.id);
                }}
                title={(useChatStore.getState().nicknames && useChatStore.getState().nicknames[chat.user.id]) || chat.user?.displayName || chat.user?.username}
              >
                <img
                  src={getImageUrl(chat.user.avatarUrl, 'avatar', chat.user.displayName || chat.user.username)}
                  alt={chat.user.displayName}
                />
              </div>
              <button
                className="fb-chat-bubble-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeChat(chat.user.id);
                }}
                title="Đóng"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
