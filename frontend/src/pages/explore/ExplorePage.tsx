import { SweetPotatoIcon } from '../../components/ui/SweetPotatoIcon';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, Loader2, BookOpen, Tag, List, LayoutGrid } from 'lucide-react';
import api from "../../services/api";
import { getImageUrl } from "../../utils/image";
import type { Story } from "../../types/story";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Button } from "../../components/ui/Button";
import "./ExplorePage.css";

const PAGE_SIZE = 18;

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  
  const pageTitle = searchQuery.trim() !== "" 
    ? `Tìm kiếm: "${searchQuery}" - Abora`
    : "Khám Phá Truyện Hay - Abora";
  useDocumentTitle(pageTitle);

  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [excludedTags, setExcludedTags] = useState<string[]>([]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [displayedCount, setDisplayedCount] = useState<number>(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch Categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<any[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data;
    },
  });

  // 2. Fetch Personalized Recommendations
  const { data: recommendations = [], isLoading: isRecommendationsLoading } = useQuery<Story[]>({
    queryKey: ["stories", "recommendations"],
    queryFn: async () => {
      const { data } = await api.get("/stories/recommendations");
      return data;
    },
  });

  // Auto-scroll recommendation banner
  useEffect(() => {
    if (recommendations.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentCarouselIndex((prev) => (prev + 1) % Math.min(recommendations.length, 5));
    }, 5000);
    return () => clearInterval(interval);
  }, [recommendations]);

  // 3. Fetch public stories
  const { data: publicStoriesPage, isLoading: isPublicStoriesLoading } = useQuery<any>({
    queryKey: ["stories", "public"],
    queryFn: async () => {
      const { data } = await api.get("/stories?size=200");
      return data;
    },
    enabled: searchQuery.trim() === "",
  });
  const publicStories: Story[] = publicStoriesPage?.content || [];

  // Fetch Banner
  const { data: bannerSetting } = useQuery<any>({
    queryKey: ["settings", "home_banner"],
    queryFn: async () => {
      const { data } = await api.get("/settings/home_banner");
      return data;
    },
  });
  const customBannerUrl = bannerSetting?.value;

  // 4. Fetch search results
  const { data: searchResults = [], isLoading: isSearchResultsLoading } = useQuery<Story[]>({
    queryKey: ["stories", "search", searchQuery],
    queryFn: async () => {
      const { data } = await api.get(`/stories/search?q=${encodeURIComponent(searchQuery)}`);
      return data;
    },
    enabled: searchQuery.trim() !== "",
  });

  const getCoverUrl = (coverImageUrl: string | null, title?: string) => {
    return getImageUrl(coverImageUrl, 'cover', title);
  };

  const clearSearch = () => {
    setSearchParams({});
  };

  // Extract all unique tags for filter options
  const activeStoriesList: Story[] = searchQuery.trim() !== "" ? searchResults : publicStories;
  
  const allTags = React.useMemo(() => {
    const tagMap = new Map<string, any>();
    activeStoriesList.forEach(story => {
      if (story.tags) {
        story.tags.forEach(t => tagMap.set(t.slug, t));
      }
    });
    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeStoriesList]);

  // Filtering Logic
  const filteredStories = activeStoriesList.filter((story: Story) => {
    if (selectedCategorySlug && !story.categories?.some((cat) => cat.slug === selectedCategorySlug)) {
      return false;
    }
    if (selectedStatus) {
      if (selectedStatus === 'ONGOING') {
        if (story.status === 'COMPLETED' || story.status === 'PAUSED' || story.status === 'HIDDEN' || story.status === 'DRAFT') {
           return false;
        }
      } else if (story.status !== selectedStatus) {
        return false;
      }
    }
    
    // Tag Include
    if (selectedTags.length > 0) {
      const storyTagSlugs = story.tags?.map(t => t.slug) || [];
      // Must have ALL selected tags
      if (!selectedTags.every(tag => storyTagSlugs.includes(tag))) {
        return false;
      }
    }
    
    // Tag Exclude
    if (excludedTags.length > 0) {
      const storyTagSlugs = story.tags?.map(t => t.slug) || [];
      // Must NOT have ANY excluded tags
      if (excludedTags.some(tag => storyTagSlugs.includes(tag))) {
        return false;
      }
    }
    
    return true;
  });

  // Infinite scroll
  const displayedStories = filteredStories.slice(0, displayedCount);
  const hasMore = displayedCount < filteredStories.length;

  const handleLoadMore = useCallback(() => {
    setDisplayedCount((prev) => Math.min(prev + PAGE_SIZE, filteredStories.length));
  }, [filteredStories.length]);

  useEffect(() => {
    setDisplayedCount(PAGE_SIZE);
  }, [selectedCategorySlug, searchQuery, selectedStatus, selectedTags, excludedTags]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, handleLoadMore]);

  const isGridLoading = searchQuery.trim() !== "" ? isSearchResultsLoading : isPublicStoriesLoading;
  const currentRecommendation = recommendations[currentCarouselIndex];

  const formatCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
    
  const toggleTagFilter = (slug: string, type: 'include' | 'exclude') => {
    if (type === 'include') {
      if (selectedTags.includes(slug)) {
        setSelectedTags(prev => prev.filter(t => t !== slug));
      } else {
        setSelectedTags(prev => [...prev, slug]);
        // Remove from excluded if present
        setExcludedTags(prev => prev.filter(t => t !== slug));
      }
    } else {
      if (excludedTags.includes(slug)) {
        setExcludedTags(prev => prev.filter(t => t !== slug));
      } else {
        setExcludedTags(prev => [...prev, slug]);
        // Remove from included if present
        setSelectedTags(prev => prev.filter(t => t !== slug));
      }
    }
  };

  return (
    <div className="explore-container fade-in">
      {/* 1. Header Banner Carousel */}
      {!isRecommendationsLoading && recommendations.length > 0 && searchQuery.trim() === "" && (
        <div className="explore-banner">
          <div 
            className="explore-banner-bg" 
            style={customBannerUrl ? { backgroundImage: `url(${customBannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          />
          <div className="banner-glow" />
          <div className="carousel-track">
            <img
              src={getCoverUrl(currentRecommendation.coverImageUrl, currentRecommendation.title)}
              className="carousel-cover"
              alt={currentRecommendation.title}
            />
            <div className="carousel-info">
              {currentRecommendation.categories && currentRecommendation.categories.length > 0 && (
                <span className="carousel-tag">{currentRecommendation.categories[0].name}</span>
              )}
              <h2 className="carousel-title">{currentRecommendation.title}</h2>
              <p className="carousel-desc">{currentRecommendation.description || "\u00A0"}</p>
              <div className="carousel-meta">
                <div className="carousel-meta-item">
                  <Eye size={16} />
                  <span>{currentRecommendation.viewCount.toLocaleString()}<span className="meta-text"> lượt đọc</span></span>
                </div>
                <div className="carousel-meta-item">
                  <SweetPotatoIcon size={16} fill="#FBBF24" />
                  <span>{currentRecommendation.favoriteCount.toLocaleString()}<span className="meta-text"> củ khoai</span></span>
                </div>
                <div className="carousel-meta-item">
                  <BookOpen size={16} />
                  <span>{currentRecommendation.chapterCount}<span className="meta-text"> chương</span></span>
                </div>
              </div>
              <Link to={`/story/${currentRecommendation.id}-${currentRecommendation.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Button variant="primary" size="sm" className="hero-explore-btn">
                    <span>Đọc Ngay</span>
                  </Button>
                  <span className="sparkle-star" style={{ top: '-4px', left: '-6px', width: '12px', height: '12px', animationDelay: '0s' }}></span>
                  <span className="sparkle-star" style={{ top: '-8px', right: '10px', width: '10px', height: '10px', animationDelay: '0.5s' }}></span>
                  <span className="sparkle-star" style={{ bottom: '-4px', right: '-6px', width: '14px', height: '14px', animationDelay: '1s' }}></span>
                  <span className="sparkle-star" style={{ bottom: '-6px', left: '15px', width: '10px', height: '10px', animationDelay: '1.5s' }}></span>
                  <span className="sparkle-star" style={{ top: '50%', left: '-12px', width: '8px', height: '8px', animationDelay: '2s' }}></span>
                  <span className="sparkle-star" style={{ top: '50%', right: '-12px', width: '8px', height: '8px', animationDelay: '2.5s' }}></span>
                </div>
              </Link>
            </div>
          </div>
          <div className="carousel-dots">
            {recommendations.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                className={`carousel-dot ${currentCarouselIndex === idx ? "active" : ""}`}
                onClick={() => setCurrentCarouselIndex(idx)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. Main Explore Layout */}
      <div className="explore-main">
        {/* Left Sidebar: Categories — sticky */}
        <aside className="category-sidebar">
          <h2 className="category-sidebar-title">Thể loại</h2>
          
          <div className="category-scroll-inner">
            {isCategoriesLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-secondary" size={18} />
              </div>
            ) : (
              <>
                <button
                  className={`category-item ${selectedCategorySlug === "" ? "active" : ""}`}
                  onClick={() => setSelectedCategorySlug("")}
                >
                  Tất cả thể loại
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    className={`category-item ${selectedCategorySlug === cat.slug ? "active" : ""}`}
                    onClick={() => setSelectedCategorySlug(cat.slug)}
                    title={cat.description}
                  >
                    {cat.name}
                  </button>
                ))}
              </>
            )}
            
            {/* Tags Filter Section */}
            {false && allTags.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h2 className="category-sidebar-title" style={{ fontSize: '1rem', paddingLeft: '0.5rem' }}>Lọc theo Tag</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
                  Bấm 1 lần: <strong>Bao gồm</strong><br/>
                  Bấm 2 lần: <strong>Ngoại trừ</strong><br/>
                  Bấm 3 lần: Bỏ chọn
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem' }}>
                  {allTags.map(tag => {
                    const isIncluded = selectedTags.includes(tag.slug);
                    const isExcluded = excludedTags.includes(tag.slug);
                    
                    let btnStyle: React.CSSProperties = {
                      padding: '0.35rem 0.6rem',
                      fontSize: '0.8rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-light)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textDecoration: 'none',
                      lineHeight: '1'
                    };
                    
                    if (isIncluded) {
                      btnStyle.background = 'rgba(139, 92, 246, 0.15)';
                      btnStyle.color = 'white';
                      btnStyle.border = '1px solid var(--primary-color)';
                    } else if (isExcluded) {
                      btnStyle.background = 'rgba(239, 68, 68, 0.15)';
                      btnStyle.color = '#ef4444';
                      btnStyle.border = '1px solid #ef4444';
                      btnStyle.textDecoration = 'line-through';
                    }
                    
                    return (
                      <button 
                        key={tag.id}
                        style={btnStyle}
                        onClick={() => {
                          if (!isIncluded && !isExcluded) toggleTagFilter(tag.slug, 'include');
                          else if (isIncluded) toggleTagFilter(tag.slug, 'exclude');
                          else if (isExcluded) {
                            setExcludedTags(prev => prev.filter(t => t !== tag.slug));
                          }
                        }}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Central Content Area */}
        <main className="explore-content-area">
          {/* Toolbar */}
          <div className="explore-toolbar">
            <div className="search-results-info-text">
              {(searchQuery.trim() !== "" || selectedCategorySlug !== "") && (
                <span>
                  Tìm thấy <strong>{filteredStories.length}</strong> kết quả
                  {searchQuery && ` cho "${searchQuery}"`}
                  {selectedCategorySlug && ` trong "${categories.find((c) => c.slug === selectedCategorySlug)?.name}"`}
                </span>
              )}
              {!searchQuery && !selectedCategorySlug && (
                <span><strong>{filteredStories.length}</strong> truyện</span>
              )}
            </div>
            <div className="view-toggle-group">
              {(selectedCategorySlug || searchQuery || selectedStatus) && (
                <button 
                  className="clear-search-btn"
                  onClick={() => {
                    setSelectedCategorySlug("");
                    clearSearch();
                    setSelectedStatus("");
                    setSelectedTags([]);
                    setExcludedTags([]);
                  }}
                  title="Xóa tất cả bộ lọc"
                >
                  Xóa bộ lọc
                </button>
              )}
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.85rem' }}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ONGOING">Đang ra</option>
                <option value="COMPLETED">Đã hoàn</option>
              </select>
              <button
                className={`view-toggle-btn ${viewMode === "card" ? "active" : ""}`}
                onClick={() => setViewMode("card")}
                title="Dạng card"
              >
                <LayoutGrid size={20} />
              </button>
              <button
                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="Dạng danh sách"
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {isGridLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={36} />
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-2xl">
              <Tag size={48} className="text-secondary mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-white mb-2">Không tìm thấy truyện nào</h3>
              <p className="text-secondary">Hãy thử tìm kiếm với từ khóa khác hoặc thay đổi thể loại.</p>
            </div>
          ) : viewMode === "card" ? (
            /* ── CARD VIEW ── */
            <div className="explore-grid-card">
              {displayedStories.map((story) => (
                <Link key={story.id} to={`/story/${story.id}-${story.slug}`} className="explore-story-card">
                  <div className="story-card-cover-wrapper">
                    <img
                      src={getCoverUrl(story.coverImageUrl, story.title)}
                      className="story-card-cover"
                      alt={story.title}
                      loading="lazy"
                    />
                    <span className="story-card-badge">
                      {story.status === "COMPLETED" ? "Đã hoàn" : "Đang ra"}
                    </span>
                  </div>
                  <div className="story-card-details">
                    <h3 className="story-card-title" title={story.title}>{story.title}</h3>
                    <p className="story-card-author">{story.authorName}</p>
                    <div className="story-card-stats">
                      <div className="story-card-stat">
                        <Eye size={11} />
                        <span>{formatCount(story.viewCount)}</span>
                      </div>
                      <div className="story-card-stat">
                        <SweetPotatoIcon size={11} fill="#FBBF24" />
                        <span>{formatCount(story.favoriteCount)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* ── LIST VIEW ── */
            <div className="explore-grid-list">
              {displayedStories.map((story) => (
                <Link key={story.id} to={`/story/${story.id}-${story.slug}`} className="explore-list-item">
                  <img
                    src={getCoverUrl(story.coverImageUrl, story.title)}
                    className="list-item-cover"
                    alt={story.title}
                    loading="lazy"
                  />
                  <div className="list-item-info">
                    <div className="list-item-top">
                      <h3 className="list-item-title">{story.title}</h3>
                      <span className={`list-item-badge ${story.status === "COMPLETED" ? "completed" : "ongoing"}`}>
                        {story.status === "COMPLETED" ? "Đã hoàn" : "Đang ra"}
                      </span>
                    </div>
                    <p className="list-item-author">{story.authorName}</p>
                    {story.description && (
                      <p className="list-item-desc">{story.description}</p>
                    )}
                    <div className="list-item-meta">
                      <span className="list-meta-item"><Eye size={13} /> {formatCount(story.viewCount)} lượt đọc</span>
                      <span className="list-meta-item"><SweetPotatoIcon size={13} fill="#FBBF24" /> {formatCount(story.favoriteCount)} củ khoai</span>
                      <span className="list-meta-item"><BookOpen size={13} /> {story.chapterCount} chương</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="load-more-trigger">
            {hasMore && <Loader2 className="animate-spin text-primary mx-auto" size={24} />}
          </div>
        </main>

        {/* Right Sidebar: Leaderboards — COMMENTED OUT (chưa phát triển sâu) */}
        {/*
        <aside className="leaderboard-sidebar">
          <div className="leaderboard-card">
            ...leaderboard content...
          </div>
        </aside>
        */}
      </div>
    </div>
  );
};
