import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useChatStore } from '../../store/chatStore';
import type { ChatPartner } from '../../store/chatStore';
import { getImageUrl } from '../../utils/image';
import './MessengerDropdown.css';

interface Conversation {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface MessengerDropdownProps {
  onClose: () => void;
}

export const MessengerDropdown: React.FC<MessengerDropdownProps> = ({ onClose }) => {
  const { openChat } = useChatStore();

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const res = await api.get('/chat/conversations');
      return res.data;
    },
    refetchInterval: 5000,
  });

  const handleSelect = (conv: Conversation) => {
    const partner: ChatPartner = {
      id: conv.userId,
      username: conv.username,
      displayName: conv.displayName,
      avatarUrl: conv.avatarUrl,
    };
    openChat(partner);
    onClose();
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="messenger-dropdown-popover" onClick={(e) => e.stopPropagation()}>
      <div className="messenger-dropdown-header">
        <h3>Tin nhắn</h3>
      </div>

      <div className="messenger-dropdown-body">
        {isLoading && conversations.length === 0 ? (
          <div className="messenger-dropdown-empty">
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="messenger-dropdown-empty">
            <MessageCircle size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
            <p>Chưa có cuộc trò chuyện nào.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.userId}
              className={`messenger-conv-item ${conv.unreadCount > 0 ? 'unread' : ''}`}
              onClick={() => handleSelect(conv)}
            >
              <img
                src={getImageUrl(conv.avatarUrl, 'avatar', conv.displayName || conv.username)}
                alt={conv.displayName}
                className="messenger-conv-avatar"
              />
              <div className="messenger-conv-info">
                <div className="messenger-conv-top">
                  <span className="messenger-conv-name">{conv.displayName || conv.username}</span>
                  <span className="messenger-conv-time">{formatTime(conv.lastMessageAt)}</span>
                </div>
                <div className="messenger-conv-bottom">
                  <p className="messenger-conv-lastmsg">{conv.lastMessage}</p>
                  {conv.unreadCount > 0 && (
                    <span className="messenger-conv-unread-badge">{conv.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
