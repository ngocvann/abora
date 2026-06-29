import React, { useRef, useState, useEffect } from 'react';
import { ImageCropperModal } from '../../components/ui/ImageCropperModal';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Camera, Heart, MessageSquare, Send, X, Edit3, Calendar, Plus, Lock, Globe, Trash2, ChevronDown, ChevronUp, BookOpen, MoreHorizontal, Flag, MoreVertical, BellOff, UserX, Info, Users, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ReportModal } from '../../components/ui/ReportModal';
import { getImageUrl } from '../../utils/image';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './ProfilePage.css';


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

interface Story {
  id: number;
  authorId: number;
  authorName: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  status: string;
  visibility: string;
  wordCount: number;
  viewCount: number;
  followCount: number;
  chapterCount: number;
  createdAt: string;
  categories: { id: number; name: string }[];
  tags: { id: number; name: string }[];
  publishedChapterCount?: number;
  favoriteCount?: number;
}

export const formatRelativeTime = (dateStr: string) => {
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

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'posts' | 'stories' | 'reading_lists'>('posts');
  const [newStatusContent, setNewStatusContent] = useState('');
  const [openCommentsPostId, setOpenCommentsPostId] = useState<number | null>(null);

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

  const [openMenuProfileId, setOpenMenuProfileId] = useState<number | null>(null);
  const [reportTarget, setReportTarget] = useState<{ type: 'STORY' | 'CHAPTER' | 'COMMENT' | 'USER' | 'POST', id: number } | null>(null);

  // Hashtag & Show More state for posts
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});

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

  const renderPostText = (post: any) => {
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

  // Follow list modal state
  const [followListModal, setFollowListModal] = useState<{ type: 'following' | 'followers' } | null>(null);
  const [followList, setFollowList] = useState<any[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // User detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mute notifications state
  const [isMuted, setIsMuted] = useState(false);
  const [muteConfirmOpen, setMuteConfirmOpen] = useState(false);


  const isMe = !username || (currentUser && username === currentUser.username);

  // 1. Fetch profile first based on username (or current user)
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useQuery({
    queryKey: ['public-profile', isMe ? currentUser?.username : username],
    queryFn: async () => {
      const targetUsername = isMe ? currentUser?.username : username;
      console.log('Fetching profile for targetUsername:', targetUsername, 'username from params:', username, 'isMe:', isMe);
      if (!targetUsername) return null;
      const res = await api.get(`/users/by-username/${targetUsername}`);
      console.log('Fetched profile response:', res.data);
      return res.data;
    },
    enabled: !!(username || currentUser)
  });

  const pageTitle = profile 
    ? `Hồ sơ của ${profile.displayName} (@${profile.username}) - Abora`
    : 'Hồ sơ người dùng - Abora';
  useDocumentTitle(pageTitle);

  console.log('ProfilePage render:', { params: useParams(), username, isMe, profileUsername: profile?.username });

  const activeUserId = profile?.id; // Now we have the resolved ID!

  // ─── Fetch Reading Lists ────────────────────────────────────────────────────
  const { data: readingLists = [], isLoading: isReadingListsLoading } = useQuery<any[]>({
    queryKey: ['user-reading-lists', activeUserId],
    queryFn: async () => {
      if (!activeUserId) return [];
      const res = await api.get(`/reading-lists/users/${activeUserId}`);
      return res.data;
    },
    enabled: !!activeUserId
  });

  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isNewListPublic, setIsNewListPublic] = useState(true);
  const [expandedListId, setExpandedListId] = useState<number | null>(null);

  const createReadingListMutation = useMutation({
    mutationFn: async (data: { name: string; isPublic: boolean }) => {
      const res = await api.post('/reading-lists', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reading-lists', activeUserId] });
      setIsCreateListModalOpen(false);
      setNewListName('');
      setIsNewListPublic(true);
      toast.success('Tạo danh sách đọc thành công!');
    },
    onError: () => {
      toast.error('Không thể tạo danh sách đọc');
    }
  });

  const removeStoryMutation = useMutation({
    mutationFn: async ({ listId, storyId }: { listId: number; storyId: number }) => {
      await api.delete(`/reading-lists/${listId}/stories/${storyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reading-lists', activeUserId] });
      toast.success('Đã xóa truyện khỏi danh sách');
    },
    onError: () => {
      toast.error('Không thể xóa truyện khỏi danh sách');
    }
  });

  // Sync global auth store when profile is fetched
  useEffect(() => {
    if (profile && isMe) {
      updateUser({ avatarUrl: profile.avatarUrl, displayName: profile.displayName });
    }
  }, [profile, isMe, updateUser]);



  // ─── Fetch Timeline Posts ──────────────────────────────────────────────────
  const { data: timelinePosts = [], isLoading: isTimelineLoading } = useQuery<Post[]>({
    queryKey: ['user-timeline', activeUserId],
    queryFn: async () => {
      if (!activeUserId) return [];
      const res = await api.get(`/posts/user/${activeUserId}`);
      return res.data;
    },
    enabled: !!activeUserId
  });

  // ─── Fetch Stories ─────────────────────────────────────────────────────────
  const { data: stories = [], isLoading: isStoriesLoading } = useQuery<Story[]>({
    queryKey: ['user-stories', activeUserId, isMe],
    queryFn: async () => {
      if (!activeUserId) return [];
      const url = isMe ? '/stories/management' : `/users/${activeUserId}/stories`;
      const res = await api.get(url);
      return res.data;
    },
    enabled: !!activeUserId
  });

  // ─── Follow / Unfollow Mutation ────────────────────────────────────────────
  const followMutation = useMutation({
    mutationFn: async () => {
      if (profile.isFollowing) {
        await api.delete(`/users/${activeUserId}/unfollow`);
      } else {
        await api.post(`/users/${activeUserId}/follow`);
      }
    },
    onSuccess: () => {
      const targetUsername = isMe ? currentUser?.username : username;
      queryClient.invalidateQueries({ queryKey: ['public-profile', targetUsername] });
    },
    onError: () => {
      toast.error('Không thể thực hiện yêu cầu theo dõi.');
    }
  });

  // Fetch mute status when profile loaded and not me
  useEffect(() => {
    if (!isMe && activeUserId && currentUser && profile?.isFollowing) {
      api.get(`/users/${activeUserId}/mute-status`)
        .then(res => setIsMuted(res.data.muted))
        .catch(() => {});
    }
  }, [isMe, activeUserId, currentUser, profile?.isFollowing]);

  const toggleMuteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/users/${activeUserId}/mute-notifications`);
      return res.data.muted;
    },
    onSuccess: (muted: boolean) => {
      setIsMuted(muted);
      toast.success(muted ? 'Dã tắt thông báo từ người dùng này.' : 'Dã bật lại thông báo.');
    },
    onError: () => toast.error('Không thể thực hiện.'),
  });

  // ─── Create Status Mutation ──────────────────────────────────────────────
  const createStatusMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post('/posts', { content, type: 'PERSONAL' });
      return res.data;
    },
    onSuccess: () => {
      setNewStatusContent('');
      queryClient.invalidateQueries({ queryKey: ['user-timeline', activeUserId] });
    },
    onError: () => {
      toast.error('Không thể đăng trạng thái.');
    }
  });

  // ─── Toggle Like Mutation ──────────────────────────────────────────────────
  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: number) => {
      await api.post(`/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-timeline', activeUserId] });
    }
  });

  // ─── Delete Post Mutation ──────────────────────────────────────────────────
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-timeline', activeUserId] });
    },
    onError: () => toast.error('Không thể xóa bài viết.')
  });

  // ─── Update Post Mutation ──────────────────────────────────────────────────
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number, content: string }) => {
      const res = await api.put(`/posts/${id}`, { content });
      return res.data;
    },
    onSuccess: () => {
      setEditingPostId(null);
      queryClient.invalidateQueries({ queryKey: ['user-timeline', activeUserId] });
    },
    onError: () => toast.error('Không thể cập nhật bài viết.')
  });



  // ─── Upload Avatar Mutation ────────────────────────────────────────────────
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/users/profile/avatar', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Cập nhật ảnh đại diện thành công!');
      queryClient.invalidateQueries({ queryKey: ['public-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-timeline'] });
      updateUser({ avatarUrl: data.avatarUrl });
    },
    onError: () => {
      toast.error('Lỗi tải ảnh đại diện');
    }
  });

  const handleAvatarClick = () => {
    if (isMe) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Vui lòng chọn ảnh nhỏ hơn 5MB');
        return;
      }
      // Open cropper modal instead of direct upload
      setSelectedFile(file);
      setCropperOpen(true);
    }
  };



  const handleCreateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusContent.trim()) return;
    createStatusMutation.mutate(newStatusContent);
  };

  if (isProfileLoading) {
    return (
      <div className="profile-loading">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (isProfileError || !profile) {
    return (
      <div className="profile-page" style={{ textAlign: 'center', padding: '4rem' }}>
        <h2 style={{ color: 'var(--danger-color)' }}>Không tìm thấy người dùng</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '1rem' }}>Người dùng không tồn tại hoặc đã bị xóa tài khoản.</p>
        <Button variant="secondary" onClick={() => navigate('/')} style={{ marginTop: '1.5rem' }}>
          Về Trang Chủ
        </Button>
      </div>
    );
  }

  const avatarSrc = profile.avatarUrl;

  return (
    <div className="profile-page fade-in">
      
      {/* 1. Header Profile Card */}
      <div className="glass-panel profile-header-card">
        <div className="profile-banner-bg" />
        
        {/* 3-dot menu moved to top right of header card */}
        {currentUser && !isMe && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
            <button 
              onClick={() => setOpenMenuProfileId(openMenuProfileId === profile.id ? null : profile.id)}
              onBlur={() => setTimeout(() => setOpenMenuProfileId(null), 150)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'rgba(255, 255, 255, 0.5)', 
                cursor: 'pointer', 
                padding: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >
              <MoreVertical size={18} />
            </button>
            {openMenuProfileId === profile.id && (
              <div style={{ 
                position: 'absolute', 
                right: '0', 
                top: '2.5rem', 
                background: '#1e293b', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '10px', 
                padding: '0.35rem', 
                zIndex: 10, 
                minWidth: '180px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.15rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
              }}>
                {/* Thông tin chi tiết */}
                <button 
                  onMouseDown={(e) => { 
                    e.preventDefault(); e.stopPropagation();
                    setShowDetailModal(true);
                    setOpenMenuProfileId(null); 
                  }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 0.6rem', width: '100%', textAlign: 'left', borderRadius: '6px' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Info size={14} /> Thông tin chi tiết
                </button>
                {/* Tắt thông báo */}
                <button 
                  onMouseDown={(e) => { 
                    e.preventDefault(); e.stopPropagation();
                    if (!profile?.isFollowing) {
                      toast('Bạn cần theo dõi người dùng này trước.');
                    } else {
                      setMuteConfirmOpen(true);
                    }
                    setOpenMenuProfileId(null);
                  }}
                  style={{ background: 'none', border: 'none', color: isMuted ? '#a78bfa' : 'rgba(255,255,255,0.85)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 0.6rem', width: '100%', textAlign: 'left', borderRadius: '6px' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <BellOff size={14} /> {isMuted ? 'Bật thông báo' : 'Tắt thông báo'}
                </button>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0.2rem 0' }} />
                {/* Chặn */}
                <button 
                  onMouseDown={(e) => { 
                    e.preventDefault(); e.stopPropagation();
                    // TODO: implement block
                    setOpenMenuProfileId(null);
                  }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 0.6rem', width: '100%', textAlign: 'left', borderRadius: '6px' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <UserX size={14} /> Chặn
                </button>
                {/* Báo cáo */}
                <button 
                  onMouseDown={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    setReportTarget({ type: 'USER', id: profile.id }); 
                    setOpenMenuProfileId(null); 
                  }}
                  style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 0.6rem', width: '100%', textAlign: 'left', borderRadius: '6px' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Flag size={14} /> Báo cáo
                </button>
              </div>
            )}
          </div>
        )}

        <div className="profile-header-content">
          
          {/* Avatar Section */}
          <div className="profile-avatar-wrapper" onClick={handleAvatarClick} style={{ cursor: isMe ? 'pointer' : 'default' }}>
            <img 
              src={getImageUrl(avatarSrc, 'avatar', profile?.displayName || profile?.username)} 
              alt="Avatar" 
              className="profile-avatar-img" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', profile?.displayName || profile?.username);
              }}
            />
            
            {isMe && (
              <div className="profile-avatar-edit-btn">
                {uploadAvatarMutation.isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Camera size={16} />
                )}
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {/* Profile Text Info */}
          <div className="profile-info-details">
            <div className="profile-name-container">
              <h1 className="profile-display-name">{profile.displayName}</h1>
              
              <div className="profile-actions-wrapper">
                {isMe ? (
                  <Button variant="secondary" size="sm" onClick={() => navigate('/settings')} className="profile-edit-btn">
                    <Edit3 size={14} className="profile-edit-icon" />
                    <span className="desktop-suffix"> Chỉnh sửa</span>
                  </Button>
                ) : (
                  currentUser && (
                    <>
                      <button
                        className={`follow-action-btn ${profile.isFollowing ? 'followed' : 'unfollowed'}`}
                        onClick={() => followMutation.mutate()}
                        disabled={followMutation.isPending}
                      >
                        {followMutation.isPending ? (
                          <Loader2 className="animate-spin inline" size={14} />
                        ) : profile.isFollowing ? (
                          'Đang theo dõi'
                        ) : (
                          'Theo dõi'
                        )}
                      </button>
                    </>
                  )
                )}
              </div>
            </div>

            <span className="profile-username-tag">@{profile.username}</span>

            <p className="profile-bio-text">
              {profile.bio || 'Chưa có thông tin giới thiệu.'}
            </p>

            <div className="profile-stats-row">
              <button
                className="stat-item stat-item-btn"
                onClick={async () => {
                  setFollowListModal({ type: 'following' });
                  setFollowListLoading(true);
                  try {
                    const res = await api.get(`/users/${activeUserId}/following`);
                    setFollowList(res.data);
                  } catch { setFollowList([]); }
                  finally { setFollowListLoading(false); }
                }}
              >
                <span className="stat-count">{profile.followingCount}</span>
                <span className="stat-label">Đang theo dõi</span>
              </button>
              <button
                className="stat-item stat-item-btn"
                onClick={async () => {
                  setFollowListModal({ type: 'followers' });
                  setFollowListLoading(true);
                  try {
                    const res = await api.get(`/users/${activeUserId}/followers`);
                    setFollowList(res.data);
                  } catch { setFollowList([]); }
                  finally { setFollowListLoading(false); }
                }}
              >
                <span className="stat-count">{profile.followersCount}</span>
                <span className="stat-label">Người theo dõi</span>
              </button>
              <div className="stat-item stat-divider">
                <span className="stat-count">{stories.length}</span>
                <span className="stat-label">Tác phẩm</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 2. Tabs selection */}
      <div className="profile-tabs-bar">
        <button
          className={`profile-tab-button ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Bài viết<span className="desktop-suffix"> cá nhân</span> ({timelinePosts.length})
        </button>
        <button
          className={`profile-tab-button ${activeTab === 'stories' ? 'active' : ''}`}
          onClick={() => setActiveTab('stories')}
        >
          {isMe ? 'Truyện của tôi' : 'Truyện'} ({stories.length})
        </button>
        <button
          className={`profile-tab-button ${activeTab === 'reading_lists' ? 'active' : ''}`}
          onClick={() => setActiveTab('reading_lists')}
        >
          Danh sách đọc ({readingLists.length})
        </button>
      </div>

      {/* 3. Tabs Content */}
      <div className="profile-tab-content">
        
        {activeTab === 'posts' && (
          <div className="posts-tab-wrapper">
            
            {/* Status Creator (only for self profile) */}
            {isMe && (
              <div className="glass-panel post-creator">
                <form onSubmit={handleCreateStatus}>
                  <textarea
                    placeholder="Hôm nay bạn đang nghĩ gì?"
                    value={newStatusContent}
                    onChange={(e) => setNewStatusContent(e.target.value)}
                    maxLength={2000}
                  />
                  <div className="creator-actions">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={createStatusMutation.isPending || !newStatusContent.trim()}
                    >
                      {createStatusMutation.isPending ? 'Đang đăng...' : 'Đăng trạng thái'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {isTimelineLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Loader2 className="animate-spin text-primary inline" size={24} />
              </div>
            ) : timelinePosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                Chưa có trạng thái hoặc bài đăng cá nhân nào.
              </div>
            ) : (
              <div className="posts-feed">
                {timelinePosts.map((post) => (
                  <div key={post.id} className="glass-panel post-card">
                    
                    {/* Header */}
                    <div className="post-header">
                      <div className="post-author-info">
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
                      <div className="post-menu-wrapper">
                        <span className="post-time">
                          {formatRelativeTime(post.createdAt)}
                        </span>
                        {currentUser && (
                          <div className="post-menu-container">
                            <button 
                              onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                              onBlur={() => setTimeout(() => setOpenMenuPostId(null), 150)}
                              className="post-menu-btn"
                            >
                            <MoreVertical size={18} />
                          </button>
                            {openMenuPostId === post.id && (
                              <div className="post-menu-dropdown">
                                {currentUser.username === post.userUsername && (
                                  <>
                                    <button 
                                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPostId(post.id); setEditPostContent(post.content); setOpenMenuPostId(null); }}
                                      className="menu-item edit"
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
                                      className="menu-item delete"
                                    >
                                      <Trash2 size={14} /> Xóa
                                    </button>
                                  </>
                                )}
                                {currentUser.username !== post.userUsername && (
                                  <button 
                                    onMouseDown={(e) => { 
                                      e.preventDefault(); 
                                      e.stopPropagation(); 
                                      setReportTarget({ type: 'POST', id: post.id }); 
                                      setOpenMenuPostId(null); 
                                    }}
                                    className="menu-item report"
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

                    {/* Content */}
                    {editingPostId === post.id ? (
                      <div className="post-content-editing">
                        <textarea
                          value={editPostContent}
                          onChange={(e) => setEditPostContent(e.target.value)}
                        />
                        <div className="edit-actions">
                          <Button size="sm" variant="secondary" onClick={() => setEditingPostId(null)}>Hủy</Button>
                          <Button size="sm" variant="primary" disabled={updatePostMutation.isPending || !editPostContent.trim()} onClick={() => updatePostMutation.mutate({ id: post.id, content: editPostContent })}>
                            {updatePostMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      renderPostText(post)
                    )}

                    {/* Footer */}
                    <div className="post-footer">
                      <button
                        className={`interaction-btn ${post.isLikedByMe ? 'liked' : ''}`}
                        onClick={() => toggleLikeMutation.mutate(post.id)}
                        disabled={!currentUser}
                      >
                        <Heart size={16} fill={post.isLikedByMe ? 'currentColor' : 'none'} />
                        <span>{post.likeCount}</span>
                      </button>
                      <button
                        className="interaction-btn"
                        onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                      >
                        <MessageSquare size={16} />
                        <span>{post.commentCount}</span>
                      </button>
                      </div>

                    {/* Comments Collapsible */}
                    {openCommentsPostId === post.id && (
                      <PostCommentsSection postId={post.id} postOwnerUsername={post.userUsername} />
                    )}

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {activeTab === 'stories' && (
          <div className="stories-tab-wrapper">
            {isStoriesLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Loader2 className="animate-spin text-primary inline" size={24} />
              </div>
            ) : stories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                Tác giả chưa đăng truyện công khai nào.
              </div>
            ) : (
              <div className="stories-list-wrapper">
                {stories.map((story) => {
                  const isStoryPublished = story.status === 'PUBLISHED' || (story.publishedChapterCount !== undefined && story.publishedChapterCount > 0);
                  return (
                    <div
                      key={story.id}
                      className="profile-story-card"
                      onClick={() => navigate(`/story/${story.id}-${story.slug}`)}
                    >
                      <img 
                        src={getImageUrl(story.coverImageUrl, 'cover', story.title)} 
                        alt="Cover" 
                        className="story-card-cover" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('data:image/svg+xml')) {
                            target.src = getImageUrl('', 'cover', story.title);
                          }
                        }}
                      />
                      
                      <div className="story-card-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <h3 className="story-card-title">{story.title}</h3>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            padding: '0.15rem 0.45rem', 
                            borderRadius: '4px', 
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            background: isStoryPublished ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isStoryPublished ? '#4ade80' : '#fbbf24',
                            border: isStoryPublished ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                          }}>
                            {isStoryPublished ? 'Đã đăng tải' : 'Bản thảo'}
                          </span>
                        </div>
                        <p className="story-card-desc">{story.description}</p>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.25rem 0' }}>
                          {story.categories.map(c => (
                            <span key={c.id} className="story-card-tag">{c.name}</span>
                          ))}
                        </div>

                        <div className="story-card-meta">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Chương">
                            <BookOpen size={13} />
                            {story.chapterCount}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Lượt đọc">
                            <Eye size={13} />
                            {story.viewCount}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Yêu thích">
                            <Heart size={13} />
                            {story.favoriteCount || 0}
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reading_lists' && (
          <div className="reading-lists-tab-wrapper">
            <div className="reading-lists-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>Danh sách đọc</h2>
              {isMe && (
                <Button variant="primary" size="sm" onClick={() => setIsCreateListModalOpen(true)}>
                  <Plus size={16} className="mr-1 inline" style={{ verticalAlign: 'middle' }} /> Tạo danh sách mới
                </Button>
              )}
            </div>

            {isReadingListsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Loader2 className="animate-spin text-primary inline" size={24} />
              </div>
            ) : readingLists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                Chưa có danh sách đọc nào được tạo.
              </div>
            ) : (
              <div className="reading-lists-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {readingLists.map((list) => {
                  const isExpanded = expandedListId === list.id;
                  return (
                    <div key={list.id} className="glass-panel reading-list-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div
                        className="reading-list-card-header"
                        onClick={() => setExpandedListId(isExpanded ? null : list.id)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div className="reading-list-title-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <BookOpen size={18} className="text-primary" />
                          <span className="reading-list-name" style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff' }}>{list.name}</span>
                          <span className={`reading-list-badge ${list.isPublic ? 'public' : 'private'}`} style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '20px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: list.isPublic ? 'rgba(34, 197, 94, 0.1)' : 'rgba(161, 161, 170, 0.1)',
                            color: list.isPublic ? '#4ade80' : '#a1a1aa'
                          }}>
                            {list.isPublic ? (
                              <>
                                <Globe size={11} className="mr-1" /> Công khai
                              </>
                            ) : (
                              <>
                                <Lock size={11} className="mr-1" /> Riêng tư
                              </>
                            )}
                          </span>
                        </div>
                        <div className="reading-list-arrow-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                          <span className="reading-list-count" style={{ fontSize: '0.85rem' }}>{list.stories?.length || 0} truyện</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="reading-list-stories-content" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', padding: '1rem' }}>
                          {(!list.stories || list.stories.length === 0) ? (
                            <div className="reading-list-empty" style={{ textAlign: 'center', padding: '1.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                              Danh sách này chưa có truyện nào.
                            </div>
                          ) : (
                            <div className="reading-list-stories-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {list.stories.map((story: any) => (
                                <div key={story.id} className="reading-list-story-item" style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '8px',
                                  background: 'rgba(255,255,255,0.01)',
                                  border: '1px solid rgba(255,255,255,0.03)',
                                  transition: 'background 0.2s ease',
                                  cursor: 'pointer'
                                }}
                                onClick={() => navigate(`/story/${story.id}-${story.slug}`)}
                                >
                                  <div className="reading-list-story-main" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                      <img
                                        src={getImageUrl(story.coverImageUrl, 'cover', story.title)}
                                        alt="Cover"
                                        className="story-item-cover"
                                        style={{ width: '40px', height: '55px', borderRadius: '4px', objectFit: 'cover', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = getImageUrl('', 'cover', story.title);
                                        }}
                                      />
                                    <div className="story-item-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                      <h4 className="story-item-title" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', margin: 0 }}>{story.title}</h4>
                                      <span className="story-item-author" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Tác giả: {story.authorName}</span>
                                    </div>
                                  </div>

                                  {isMe && (
                                    <button
                                      className="remove-story-btn"
                                      title="Xóa khỏi danh sách"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmModal({
                                          isOpen: true,
                                          title: 'Xóa khỏi danh sách',
                                          message: `Bạn có chắc chắn muốn xóa truyện "${story.title}" khỏi danh sách này?`,
                                          onConfirm: () => {
                                            removeStoryMutation.mutate({ listId: list.id, storyId: story.id });
                                          }
                                        });
                                      }}
                                      disabled={removeStoryMutation.isPending}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer',
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#ef4444';
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                                        e.currentTarget.style.background = 'none';
                                      }}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>



      {reportTarget && (
        <ReportModal 
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}

      {/* Mute Confirm Modal */}
      <ConfirmModal
        isOpen={muteConfirmOpen}
        onCancel={() => setMuteConfirmOpen(false)}
        onConfirm={() => { toggleMuteMutation.mutate(); setMuteConfirmOpen(false); }}
        title={isMuted ? 'Bật lại thông báo' : 'Tắt thông báo'}
        message={isMuted
          ? `Bạn sẽ nhận lại thông báo từ ${profile?.displayName}. Bạn có chắc không?`
          : `Bạn sẽ không nhận thông báo từ ${profile?.displayName} nữa. Bạn có chắc không?`
        }
        confirmText={isMuted ? 'Bật thông báo' : 'Tắt thông báo'}
        cancelText="Hủy"
      />

      {/* Follow List Modal */}
      {followListModal && (
        <div className="modal-overlay" onClick={() => setFollowListModal(null)}>
          <div className="modal-content" style={{ maxWidth: '420px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} />
                {followListModal.type === 'following' ? 'Đang theo dõi' : 'Người theo dõi'}
              </h3>
              <button className="modal-close-btn" onClick={() => setFollowListModal(null)}><X size={20} /></button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
              {followListLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" size={24} /></div>
              ) : followList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Chưa có ai.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {followList.map((u: any) => (
                    <div
                      key={u.id}
                      onClick={() => { setFollowListModal(null); navigate(`/${u.username}`); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.5rem', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <img 
                        src={getImageUrl(u.avatarUrl, 'avatar', u.displayName || u.username)} 
                        alt="" 
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', u.displayName || u.username);
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.displayName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>@{u.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Info size={18} /> Thông tin chi tiết</h3>
              <button className="modal-close-btn" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>
                <Calendar size={15} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.4)' }} />
                <span>Đã tham gia: <strong style={{ color: '#fff' }}>{new Date(profile.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></span>
              </div>
              {/* Có thể thêm thêm thông tin tại đây */}
            </div>
          </div>
        </div>
      )}

      {/* 5. Create Reading List Modal */}
      {isCreateListModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Tạo danh sách đọc mới</h3>
              <button className="modal-close-btn" onClick={() => setIsCreateListModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newListName.trim()) {
                  alert('Tên danh sách không được trống');
                  return;
                }
                createReadingListMutation.mutate({
                  name: newListName,
                  isPublic: isNewListPublic
                });
              }}
              className="edit-profile-form"
            >
              <div className="form-group">
                <label>Tên danh sách *</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Ví dụ: Truyện yêu thích, Đọc sau..."
                  required
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="isPublicCheck"
                  checked={isNewListPublic}
                  onChange={(e) => setIsNewListPublic(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="isPublicCheck" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '0.95rem' }}>
                  Công khai danh sách này (mọi người có thể nhìn thấy)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button type="button" variant="secondary" onClick={() => setIsCreateListModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={createReadingListMutation.isPending}>
                  {createReadingListMutation.isPending ? 'Đang tạo...' : 'Tạo mới'}
                </Button>
              </div>
            </form>
          </div>
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
      <ImageCropperModal
        isOpen={cropperOpen}
        imageFile={selectedFile}
        onClose={() => {
          setCropperOpen(false);
          setSelectedFile(null);
        }}
        onCropConfirm={(croppedFile) => {
          uploadAvatarMutation.mutate(croppedFile);
          setCropperOpen(false);
          setSelectedFile(null);
        }}
      />
    </div>
  );
};

// ─── Reuse Comments Section helper from ForumPage ───────────────────────────

interface PostCommentsSectionProps {
  postId: number;
  postOwnerUsername: string;
}

export const PostCommentsSection: React.FC<PostCommentsSectionProps> = ({ postId, postOwnerUsername }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: number, name: string, username: string, isSubReply: boolean } | null>(null);

  const [openMenuCommentId, setOpenMenuCommentId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const { data: comments = [], isLoading: commentsLoading } = useQuery<any[]>({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const res = await api.get(`/posts/${postId}/comments`);
      return res.data;
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string, parentId?: number }) => {
      const payload: any = { content };
      if (parentId) payload.parentId = parentId;
      const res = await api.post(`/posts/${postId}/comments`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      setCommentText('');
      setReplyText('');
      setReplyingTo(null);
    },
    onError: () => {
      toast.error('Không thể đăng bình luận.');
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
    onError: () => toast.error('Không thể cập nhật bình luận.')
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
    onError: () => toast.error('Không thể xóa bình luận.')
  });

  const reportMutation = useMutation({
    mutationFn: async ({ targetType, targetId, reason }: { targetType: string, targetId: number, reason: string }) => {
      await api.post('/reports', { targetType, targetId, reason });
    },
    onSuccess: () => toast.success('Đã gửi báo cáo thành công.'),
    onError: () => toast.error('Không thể gửi báo cáo.')
  });

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ content: commentText });
  };

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
          <div onClick={() => {
            if (window.location.pathname === `/${comment.userUsername}`) {
              window.location.reload();
            } else {
              navigate(`/${comment.userUsername}`);
            }
          }} style={{ cursor: 'pointer' }}>
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
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); const reason = window.prompt('Nhập lý do báo cáo:'); if (reason) reportMutation.mutate({ targetType: 'POST_COMMENT', targetId: comment.id, reason }); setOpenMenuCommentId(null); }}
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
                style={{ flex: 1, padding: '0.75rem 1.25rem', fontSize: '0.95rem', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
              />
              <button
                type="submit"
                className="send-comment-btn"
                disabled={addCommentMutation.isPending || !replyText.trim()}
                style={{ width: '40px', height: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', padding: 0 }}
              >
                {addCommentMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              </button>
            </form>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map((reply: any) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="comments-section" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '0.75rem' }}>
      
      {commentsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}>
          <Loader2 className="animate-spin text-primary" size={16} />
        </div>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center', marginTop: '1rem' }}>
          Chưa có bình luận nào.
        </p>
      ) : (
        <div className="comments-list" style={{ marginTop: '0.5rem' }}>
          {comments.map((c: any) => renderComment(c))}
        </div>
      )}

      {user && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          <form onSubmit={handleSendComment} className="comment-input-wrapper">
            <input
              type="text"
              placeholder="Viết bình luận..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={1000}
              style={{ fontSize: '0.95rem', flex: 1, padding: '0.75rem 1.25rem', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
            <button
              type="submit"
              className="send-comment-btn"
              disabled={addCommentMutation.isPending || !commentText.trim()}
              style={{ width: '40px', height: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
            >
              {addCommentMutation.isPending ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Send size={14} />
              )}
            </button>
          </form>
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
    </div>
  );
};
