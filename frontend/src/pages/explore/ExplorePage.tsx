import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Star, Eye, Loader2, BookOpen, Tag, List, LayoutGrid, Heart } from "lucide-react";
import api from "../../services/api";
import { getImageUrl } from "../../utils/image";
import type { Story } from "../../types/story";
import "./ExplorePage.css";

const PAGE_SIZE = 18;

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
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

  // Filtering Logic
  const activeStoriesList: Story[] = searchQuery.trim() !== "" ? searchResults : publicStories;
  const filteredStories = activeStoriesList.filter((story: Story) => {
    if (!selectedCategorySlug) return true;
    return story.categories?.some((cat) => cat.slug === selectedCategorySlug);
  });

  // Infinite scroll
  const displayedStories = filteredStories.slice(0, displayedCount);
  const hasMore = displayedCount < filteredStories.length;

  const handleLoadMore = useCallback(() => {
    setDisplayedCount((prev) => Math.min(prev + PAGE_SIZE, filteredStories.length));
  }, [filteredStories.length]);

  useEffect(() => {
    setDisplayedCount(PAGE_SIZE);
  }, [selectedCategorySlug, searchQuery]);

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

  return (
    <div className="explore-container fade-in">
      {/* 1. Header Banner Carousel */}
      {!isRecommendationsLoading && recommendations.length > 0 && searchQuery.trim() === "" && (
        <div className="explore-banner">
          <div className="explore-banner-bg" />
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
              <p className="carousel-desc">{currentRecommendation.description}</p>
              <div className="carousel-meta">
                <div className="carousel-meta-item">
                  <Eye size={16} />
                  <span>{currentRecommendation.viewCount.toLocaleString()} lượt xem</span>
                </div>
                <div className="carousel-meta-item">
                  <Star size={16} />
                  <span>{currentRecommendation.followCount.toLocaleString()} lượt vote</span>
                </div>
                <div className="carousel-meta-item">
                  <BookOpen size={16} />
                  <span>{currentRecommendation.chapterCount} chương</span>
                </div>
              </div>
              <Link to={`/story/${currentRecommendation.id}-${currentRecommendation.slug}`} className="carousel-btn">
                Đọc Ngay
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
          {isCategoriesLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-secondary" size={18} />
            </div>
          ) : (
            <div className="category-scroll-inner">
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
            </div>
          )}
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
              {(searchQuery.trim() !== "" || selectedCategorySlug !== "") && (
                <button className="clear-search-btn" onClick={() => { clearSearch(); setSelectedCategorySlug(""); }}>
                  Xóa bộ lọc
                </button>
              )}
              <button
                className={`view-toggle-btn ${viewMode === "card" ? "active" : ""}`}
                onClick={() => setViewMode("card")}
                title="Dạng card"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="Dạng danh sách"
              >
                <List size={16} />
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
                      {story.status === "COMPLETED" ? "Hoàn tất" : "Đang ra"}
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
                        <Heart size={11} />
                        <span>{formatCount(story.followCount)}</span>
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
                        {story.status === "COMPLETED" ? "Hoàn tất" : "Đang ra"}
                      </span>
                    </div>
                    <p className="list-item-author">{story.authorName}</p>
                    {story.description && (
                      <p className="list-item-desc">{story.description}</p>
                    )}
                    <div className="list-item-meta">
                      <span className="list-meta-item"><Eye size={13} /> {formatCount(story.viewCount)} lượt xem</span>
                      <span className="list-meta-item"><Heart size={13} /> {formatCount(story.followCount)} yêu thích</span>
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
