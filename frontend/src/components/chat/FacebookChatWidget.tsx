import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Minus, X, Send, Loader2 } from 'lucide-react';
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
  content: string;
  isRead: boolean;
  createdAt: string;
}

const SingleChatWindow: React.FC<{
  partner: ChatPartner;
  onMinimize: () => void;
  onClose: () => void;
}> = ({ partner, onMinimize, onClose }) => {
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

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
    mutationFn: async (content: string) => {
      const res = await api.post('/chat/send', { recipientId: partner.id, content });
      return res.data;
    },
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', partner.id] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại!';
      alert(msg);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(text.trim());
  };

  return (
    <div className="fb-chat-box">
      <div className="fb-chat-header">
        <div className="fb-chat-user" onClick={() => window.open(`/${partner.username}`, '_blank')}>
          <img
            src={getImageUrl(partner.avatarUrl, 'avatar', partner.displayName || partner.username)}
            alt={partner.displayName}
            className="fb-chat-avatar"
          />
          <div className="fb-chat-user-info">
            <span className="fb-chat-name">{partner.displayName || partner.username}</span>
          </div>
        </div>

        <div className="fb-chat-controls">
          <button className="fb-chat-btn" onClick={onMinimize} title="Thu nhỏ">
            <Minus size={16} />
          </button>
          <button className="fb-chat-btn close" onClick={onClose} title="Đóng">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="fb-chat-body">
        {isLoading && messages.length === 0 ? (
          <div className="fb-chat-loading">
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : messages.length === 0 ? (
          <div className="fb-chat-empty">
            <p>Hãy gửi lời chào đến {partner.displayName}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`fb-msg-row ${isMe ? 'me' : 'other'}`}>
                {!isMe && (
                  <img
                    src={getImageUrl(partner.avatarUrl, 'avatar', partner.displayName)}
                    alt={partner.displayName}
                    className="fb-msg-avatar"
                  />
                )}
                <div className="fb-msg-bubble">{msg.content}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="fb-chat-footer" onSubmit={handleSend}>
        <input
          type="text"
          className="fb-chat-input"
          placeholder="Nhập tin nhắn..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="fb-chat-send-btn"
          disabled={!text.trim() || sendMessageMutation.isPending}
        >
          {sendMessageMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};

export const FacebookChatWidget: React.FC = () => {
  const { user } = useAuthStore();
  const { activeChats, minimizeChat, expandChat, closeChat, setTotalUnreadCount } = useChatStore();

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
        {openChats.map((chat) => (
          <SingleChatWindow
            key={chat.user.id}
            partner={chat.user}
            onMinimize={() => minimizeChat(chat.user.id)}
            onClose={() => closeChat(chat.user.id)}
          />
        ))}
      </div>

      {/* Minimized Floating Chat Bubbles on bottom right */}
      <div className="fb-chat-bubbles-col">
        {minimizedChats.map((chat) => (
          <div key={chat.user.id} className="fb-chat-bubble-wrapper">
            <div
              className="fb-chat-bubble-avatar"
              onClick={() => expandChat(chat.user.id)}
              title={chat.user.displayName || chat.user.username}
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
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
