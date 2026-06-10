import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { NotificationPopover } from '../ui/NotificationPopover';
import { Search, Menu, ChevronDown, User as UserIcon, Book, Settings, Palette, HelpCircle, LogOut, Shield, Loader2, X, Home, Compass, Library } from 'lucide-react';
import api from '../../services/api';
import { getImageUrl } from '../../utils/image';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Search Optimization States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load recent searches
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Debounced search queries
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSuggestions([]);
      setUserSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const [storiesRes, usersRes] = await Promise.all([
          api.get(`/stories/search?q=${encodeURIComponent(searchQuery)}`),
          api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`)
        ]);
        setSuggestions(storiesRes.data.slice(0, 5)); // limit to 5
        setUserSuggestions(usersRes.data.slice(0, 3)); // limit to 3 users
      } catch (error) {
        console.error('Error fetching suggestions', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const saveSearchQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const filtered = recentSearches.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleDeleteRecent = (query: string) => {
    const updated = recentSearches.filter((q) => q !== query);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleClearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleSelectRecent = (query: string) => {
    setSearchQuery(query);
    saveSearchQuery(query);
    navigate(`/explore?q=${encodeURIComponent(query)}`);
    setIsSearchFocused(false);
  };

  const handleSelectSuggestion = (story: any) => {
    saveSearchQuery(story.title);
    navigate(`/story/${story.slug}`);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const listLength = searchQuery.trim() !== '' ? suggestions.length : recentSearches.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1 >= listLength ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev - 1 < 0 ? listLength - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < listLength) {
        if (searchQuery.trim() !== '') {
          handleSelectSuggestion(suggestions[activeSuggestionIndex]);
        } else {
          handleSelectRecent(recentSearches[activeSuggestionIndex]);
        }
      } else if (searchQuery.trim() !== '') {
        saveSearchQuery(searchQuery.trim());
        navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
        setIsSearchFocused(false);
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };



  return (
    <>
      <nav className="navbar glass-panel">
        <div className="navbar-container">
          <div className="navbar-left">
            <button 
              className="mobile-menu-toggle" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/" className="navbar-logo-link">
              <img src="/logo.png" alt="Abora Logo" className="navbar-logo-img" />
            </Link>
          </div>

          {/* Khối Giữa: Menu & Search */}
          <div className="navbar-center">
            <div className="navbar-links">
              <Link to="/" className="nav-link">Trang chủ</Link>
              <Link to="/explore" className="nav-link">Khám phá</Link>
              {/* <Link to="/forum" className="nav-link">Diễn đàn</Link> */}
              <Link to="/library" className="nav-link">Thư viện</Link>
              <Link to="/studio" className="nav-link">Viết truyện</Link>
            </div>

            <div className="navbar-search" ref={searchRef}>
              <Search className="search-icon" size={15} />
              <input
                type="text"
                placeholder="Tìm kiếm truyện, tác giả..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setActiveSuggestionIndex(-1); }}
                onFocus={() => { setIsSearchFocused(true); setActiveSuggestionIndex(-1); }}
                onKeyDown={handleKeyDown}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="search-clear-btn" 
                  onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                >
                  <X size={14} />
                </button>
              )}

              {isSearchFocused && (
                <div className="search-dropdown-popup">
                  {isSearching ? (
                    <div className="search-popup-status">
                      <Loader2 className="animate-spin text-primary mr-2" size={14} />
                      <span>Đang tìm kiếm...</span>
                    </div>
                  ) : searchQuery.trim() !== '' ? (
                    <div className="suggestions-group-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="suggestions-group">
                        <div className="group-title">Tác phẩm</div>
                        {suggestions.length > 0 ? (
                          suggestions.map((story: any, idx) => (
                            <div
                              key={story.id}
                              className={`suggestion-item ${idx === activeSuggestionIndex ? 'active' : ''}`}
                              onClick={() => handleSelectSuggestion(story)}
                              onMouseEnter={() => setActiveSuggestionIndex(idx)}
                            >
                              <img 
                                src={getImageUrl(story.coverImageUrl, 'cover', story.title)} 
                                alt={story.title} 
                                className="suggestion-cover" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getImageUrl('', 'cover', story.title);
                                }}
                              />
                              <div className="suggestion-info">
                                <span className="suggestion-title">{story.title}</span>
                                <span className="suggestion-author">Bởi {story.authorDisplayName || story.authorName || 'Tác giả'}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="search-popup-empty">Không tìm thấy tác phẩm nào</div>
                        )}
                      </div>

                      {userSuggestions.length > 0 && (
                        <div className="suggestions-group" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                          <div className="group-title">Tác giả</div>
                          {userSuggestions.map((u: any) => (
                            <div
                              key={u.id}
                              className="suggestion-item"
                              onClick={() => {
                                navigate(`/${u.username}`);
                                setSearchQuery('');
                                setIsSearchFocused(false);
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              <div className="avatar-circle" style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                                <img 
                                  src={getImageUrl(u.avatarUrl, 'avatar', u.displayName)} 
                                  alt={u.displayName} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', u.displayName);
                                  }}
                                />
                              </div>
                              <div className="suggestion-info" style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="suggestion-title" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{u.displayName}</span>
                                <span className="suggestion-author" style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>@{u.username}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="suggestions-group">
                      <div className="group-title-row">
                        <span className="group-title">Tìm kiếm gần đây</span>
                        {recentSearches.length > 0 && (
                          <button type="button" className="clear-history-btn" onClick={handleClearAllRecent}>
                            Xóa tất cả
                          </button>
                        )}
                      </div>
                      {recentSearches.length > 0 ? (
                        recentSearches.map((query, idx) => (
                          <div
                            key={idx}
                            className={`recent-item ${idx === activeSuggestionIndex ? 'active' : ''}`}
                            onClick={() => handleSelectRecent(query)}
                            onMouseEnter={() => setActiveSuggestionIndex(idx)}
                          >
                            <span className="recent-text">{query}</span>
                            <button
                              type="button"
                              className="delete-recent-btn"
                              onClick={(e) => { e.stopPropagation(); handleDeleteRecent(query); }}
                            >
                              &times;
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="search-popup-empty">Chưa có tìm kiếm gần đây</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Khối Phải: Auth State */}
          <div className="navbar-actions">
            {/* Mobile/Tablet Search Toggle Icon */}
            <button 
              className="mobile-search-toggle" 
              onClick={() => setIsMobileSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {isAuthenticated ? (
              <div className="user-menu" ref={dropdownRef}>
                {/* Nút Admin Workspace (chỉ hiện cho ADMIN) */}
                {user?.roles?.includes('ADMIN') && (
                  <button 
                    onClick={() => navigate('/admin')}
                    className="navbar-admin-btn"
                  >
                    <Shield size={12} /> Admin
                  </button>
                )}

                {/* Notification Bell */}
                <div onClick={() => { setIsNotifOpen(v => !v); setIsDropdownOpen(false); }}>
                  <NotificationPopover
                    isOpen={isNotifOpen}
                    onClose={() => setIsNotifOpen(false)}
                  />
                </div>

                {/* Avatar + Dropdown */}
                <div
                  className="avatar-trigger"
                  onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsNotifOpen(false); }}
                >
                  <div className="avatar-circle">
                    <img 
                      src={getImageUrl(user?.avatarUrl, 'avatar', user?.displayName || user?.username || 'User')} 
                      alt="Avatar" 
                      className="navbar-avatar-image" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', user?.displayName || user?.username || 'User');
                      }}
                    />
                  </div>
                  <ChevronDown size={14} className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} />
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="dropdown-menu fade-in-fast">
                    <div className="dropdown-header">
                      <p className="dropdown-name">{user?.displayName}</p>
                      <p className="dropdown-email">{user?.email}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate(`/${user?.username || 'profile'}`); }}>
                      <UserIcon size={14} /> Hồ sơ của tôi
                    </button>
                    <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/library'); }}>
                      <Book size={14} /> Thư viện của tôi
                    </button>
                    <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/settings'); }}>
                      <Settings size={14} /> Cài đặt tài khoản
                    </button>
                    <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/theme'); }}>
                      <Palette size={14} /> Giao diện
                    </button>
                    <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/help'); }}>
                      <HelpCircle size={14} /> Trợ giúp
                    </button>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <LogOut size={14} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Đăng nhập</Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>Đăng ký</Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Slide-Out Menu Drawer */}
      <div className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link to="/" className="navbar-logo-link" onClick={() => setIsMobileMenuOpen(false)}>
            <img src="/logo.png" alt="Abora Logo" className="navbar-logo-img" />
          </Link>
          <button 
            type="button"
            className="mobile-drawer-close" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mobile-drawer-links">
          <Link to="/" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
            <Home size={18} />
            <span>Trang chủ</span>
          </Link>
          <Link to="/explore" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
            <Compass size={18} />
            <span>Khám phá</span>
          </Link>
          {/* <Link to="/forum" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
            <MessageSquare size={18} />
            <span>Diễn đàn</span>
          </Link> */}
          <Link to="/library" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
            <Library size={18} />
            <span>Thư viện</span>
          </Link>
          <Link to="/studio" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
            <Book size={18} />
            <span>Viết truyện</span>
          </Link>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="mobile-search-overlay fade-in-fast">
          <div className="mobile-search-header">
            <button 
              type="button"
              className="mobile-search-back-btn"
              onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }}
            >
              <X size={20} />
            </button>
            <div className="mobile-search-input-container">
              <Search className="mobile-search-input-icon" size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm truyện, tác giả..."
                className="mobile-search-input"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setActiveSuggestionIndex(-1); }}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="mobile-search-clear" 
                  onClick={() => { setSearchQuery(''); setSuggestions([]); setUserSuggestions([]); }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="mobile-search-spacer"></div>
          </div>
          
          <div className="mobile-search-body">
            {isSearching ? (
              <div className="search-popup-status">
                <Loader2 className="animate-spin text-primary mr-2" size={14} />
                <span>Đang tìm kiếm...</span>
              </div>
            ) : searchQuery.trim() !== '' ? (
              <div className="suggestions-group-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="suggestions-group">
                  <div className="group-title">Tác phẩm</div>
                  {suggestions.length > 0 ? (
                    suggestions.map((story: any) => (
                      <div
                        key={story.id}
                        className="suggestion-item"
                        onClick={() => {
                          handleSelectSuggestion(story);
                          setIsMobileSearchOpen(false);
                        }}
                      >
                        <img 
                          src={getImageUrl(story.coverImageUrl, 'cover', story.title)} 
                          alt={story.title} 
                          className="suggestion-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl('', 'cover', story.title);
                          }}
                        />
                        <div className="suggestion-info">
                          <span className="suggestion-title">{story.title}</span>
                          <span className="suggestion-author">Bởi {story.authorDisplayName || story.authorName || 'Tác giả'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="search-popup-empty">Không tìm thấy tác phẩm nào</div>
                  )}
                </div>

                {userSuggestions.length > 0 && (
                  <div className="suggestions-group" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                    <div className="group-title">Tác giả</div>
                    {userSuggestions.map((u: any) => (
                      <div
                        key={u.id}
                        className="suggestion-item"
                        onClick={() => {
                          navigate(`/${u.username}`);
                          setSearchQuery('');
                          setIsMobileSearchOpen(false);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <div className="avatar-circle" style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                          <img 
                            src={getImageUrl(u.avatarUrl, 'avatar', u.displayName)} 
                            alt={u.displayName} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getImageUrl('', 'avatar', u.displayName);
                            }}
                          />
                        </div>
                        <div className="suggestion-info" style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="suggestion-title" style={{ fontSize: '0.875rem', fontWeight: 500 }}>{u.displayName}</span>
                          <span className="suggestion-author" style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>@{u.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="suggestions-group">
                <div className="group-title-row">
                  <span className="group-title">Tìm kiếm gần đây</span>
                  {recentSearches.length > 0 && (
                    <button type="button" className="clear-history-btn" onClick={handleClearAllRecent}>
                      Xóa tất cả
                    </button>
                  )}
                </div>
                {recentSearches.length > 0 ? (
                  recentSearches.map((query, idx) => (
                    <div
                      key={idx}
                      className="recent-item"
                      onClick={() => {
                        handleSelectRecent(query);
                        setIsMobileSearchOpen(false);
                      }}
                    >
                      <span className="recent-text">{query}</span>
                      <button
                        type="button"
                        className="delete-recent-btn"
                        onClick={(e) => { e.stopPropagation(); handleDeleteRecent(query); }}
                      >
                        &times;
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="search-popup-empty">Chưa có tìm kiếm gần đây</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mobile-bottom-nav">
        <NavLink to="/" className="mobile-bottom-nav-item" end>
          <Home size={20} />
          <span>Trang chủ</span>
        </NavLink>
        <NavLink to="/explore" className="mobile-bottom-nav-item">
          <Compass size={20} />
          <span>Khám phá</span>
        </NavLink>
        <NavLink to="/library" className="mobile-bottom-nav-item">
          <Library size={20} />
          <span>Thư viện</span>
        </NavLink>
        <NavLink to="/studio" className="mobile-bottom-nav-item">
          <Book size={20} />
          <span>Viết truyện</span>
        </NavLink>
        {isAuthenticated ? (
          <NavLink to="/profile" className="mobile-bottom-nav-item">
            <UserIcon size={20} />
            <span>Tôi</span>
          </NavLink>
        ) : (
          <NavLink to="/login" className="mobile-bottom-nav-item">
            <UserIcon size={20} />
            <span>Tôi</span>
          </NavLink>
        )}
      </div>
    </>
  );
};
