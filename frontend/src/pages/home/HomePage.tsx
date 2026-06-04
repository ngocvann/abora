import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Flame, Loader2, Compass } from "lucide-react";
import api from "../../services/api";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { getImageUrl } from "../../utils/image";
import type { Story } from "../../types/story";
import "./HomePage.css";

// ─── Custom Story Card for Slider ───────────────────────────────────────────
interface HomeStoryCardProps {
  story: Story;
  showTrendingBadge?: boolean;
  index?: number;
  showProgress?: boolean;
}

const HomeStoryCard: React.FC<HomeStoryCardProps> = ({ story, showTrendingBadge, index, showProgress }) => {
  const coverUrl = getImageUrl(story.coverImageUrl, 'cover', story.title);

  // Generate a stable pseudo-random progress for visual effect if real progress is missing
  const progressPercent = Math.min(((story.id % 7) + 3) * 10, 100);

  return (
    <Link to={`/story/${story.id}-${story.slug}`} className="home-story-card fade-in">
      <div className="home-story-cover-wrapper">
        <img
          src={coverUrl}
          alt={`Bìa truyện ${story.title}`}
          className="home-story-cover"
          loading="lazy"
        />
        {showTrendingBadge && typeof index === "number" && (
          <div className="trending-rank-badge">
            <Flame size={12} className="inline mr-1" style={{ verticalAlign: "middle" }} /> #{index + 1}
          </div>
        )}
      </div>
      
      {/* Progress Bar — only shown for stories user is already reading */}
      {showProgress && (
        <div className="home-story-progress-bg">
          <div className="home-story-progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      )}

      <div className="home-story-info">
        <h3 className="home-story-title" title={story.title}>
          {story.title}
        </h3>
        <p className="home-story-author">{story.authorName}</p>
      </div>
    </Link>
  );
};

// ─── Main HomePage Component ────────────────────────────────────────────────
export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [columns, setColumns] = React.useState(6);
  const [readingRows, setReadingRows] = React.useState(2);
  const [personalizedRows, setPersonalizedRows] = React.useState(2);
  const [trendingRows, setTrendingRows] = React.useState(2);

  React.useEffect(() => {
    const handleResize = () => {
      if (gridRef.current) {
        const gridStyle = window.getComputedStyle(gridRef.current);
        const gridTemplateColumns = gridStyle.getPropertyValue('grid-template-columns');
        if (gridTemplateColumns) {
          const cols = gridTemplateColumns.trim().split(/\s+/).length;
          if (cols > 0) {
            setColumns(cols);
            return;
          }
        }
      }
      // Fallback calculation in case ref is not ready
      const w = window.innerWidth;
      if (w <= 480) setColumns(2);
      else if (w <= 900) setColumns(Math.floor((w - 64) / 132));
      else setColumns(Math.floor((w - 100) / 179));
    };

    handleResize();
    const timer = setTimeout(handleResize, 100);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  // 1. Fetch "Tiếp tục đọc dở"
  const { data: storiesReading = [], isLoading: isReadingLoading } = useQuery<Story[]>({
    queryKey: ["stories", "recommend", "reading"],
    queryFn: async () => {
      const { data } = await api.get("/stories/recommend/reading");
      return data;
    },
    enabled: isAuthenticated,
  });

  // 2. Fetch "Đề xuất cho bạn"
  const { data: storiesPersonalized = [], isLoading: isPersonalizedLoading } = useQuery<Story[]>({
    queryKey: ["stories", "recommend", "personalized"],
    queryFn: async () => {
      const { data } = await api.get("/stories/recommend/personalized");
      return data;
    },
  });

  // 3. Fetch "Thịnh hành tuần qua"
  const { data: storiesTrending = [], isLoading: isTrendingLoading } = useQuery<Story[]>({
    queryKey: ["stories", "recommend", "trending"],
    queryFn: async () => {
      const { data } = await api.get("/stories/recommend/trending");
      return data;
    },
  });

  return (
    <div ref={containerRef} className="home-container fade-in">
      
      {/* Hero Section */}
      <section className="hero-section relative overflow-hidden">
        {/* Background illustration */}
        <div className="hero-bg-image"></div>
        
        {/* Background glow effects (optional, keeping minimal for illustration) */}
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="hero-content text-left">
          <h1 className="hero-title">
            Khám phá vũ trụ <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Abora</span>
          </h1>
          <p className="hero-subtitle">
            Nơi những câu chuyện tuyệt vời nhất được sinh ra, nuôi dưỡng và lan tỏa giá trị đích thực.
          </p>
          <div style={{ marginTop: "2rem" }}>
            <Link to="/explore">
              <Button size="lg" className="rounded-full shadow-[0_4px_15px_var(--primary-glow)] hover:shadow-[0_8px_25px_var(--primary-glow)] transition-all px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-0 text-[1.1rem]">
                <Compass size={18} style={{ verticalAlign: "middle", marginBottom: "2px", marginRight: "7px" }} />
                <span>Khám Phá Ngay</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 1. Continue Reading Section */}
      {isAuthenticated && storiesReading && storiesReading.length > 0 && (
        <section className="stories-section">
          <div className="section-header-row">
            <h2 className="section-title">Tiếp tục đọc dở</h2>
            <span className="section-subtitle-tag">Tiếp tục cuộc hành trình của bạn</span>
          </div>
          {isReadingLoading ? (
            <div className="slider-loading">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <>
              <div className="slider-wrapper">
                <div ref={gridRef} className="slider-content">
                  {storiesReading.slice(0, readingRows * columns).map((story) => (
                    <HomeStoryCard key={story.id} story={story} showProgress={true} />
                  ))}
                </div>
              </div>
              {storiesReading.length > readingRows * columns && (
                <div className="see-more-container">
                  <Button 
                    variant="outline" 
                    onClick={() => setReadingRows(prev => prev + 3)}
                    className="see-more-btn"
                  >
                    Xem thêm
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* 2. Personalized Recommendation Section */}
      <section className="stories-section">
        <div className="section-header-row">
          <h2 className="section-title">Gợi ý dành riêng cho bạn</h2>
          <span className="section-subtitle-tag">Dựa trên sở thích của bạn</span>
        </div>
        {isPersonalizedLoading ? (
          <div className="slider-loading">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : storiesPersonalized.length === 0 ? (
          <div className="slider-empty">
            Chưa có gợi ý nào cho bạn. Hãy đọc thêm truyện để hệ thống phân tích nhé!
          </div>
        ) : (
          <>
            <div className="slider-wrapper">
              <div ref={gridRef} className="slider-content">
                {storiesPersonalized.slice(0, personalizedRows * columns).map((story) => (
                  <HomeStoryCard key={story.id} story={story} />
                ))}
              </div>
            </div>
            {storiesPersonalized.length > personalizedRows * columns && (
              <div className="see-more-container">
                <Button 
                  variant="outline" 
                  onClick={() => setPersonalizedRows(prev => prev + 3)}
                  className="see-more-btn"
                >
                  Xem thêm
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* 3. Weekly Trending Section */}
      <section className="stories-section">
        <div className="section-header-row">
          <h2 className="section-title">Bảng xếp hạng Hot tuần này</h2>
          <span className="section-subtitle-tag">Cập nhật xu hướng đọc truyện mới nhất</span>
        </div>
        {isTrendingLoading ? (
          <div className="slider-loading">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : storiesTrending.length === 0 ? (
          <div className="slider-empty">
            Chưa có bảng xếp hạng thịnh hành trong tuần này.
          </div>
        ) : (
          <>
            <div className="slider-wrapper">
              <div ref={gridRef} className="slider-content">
                {storiesTrending.slice(0, trendingRows * columns).map((story, idx) => (
                  <HomeStoryCard key={story.id} story={story} showTrendingBadge={true} index={idx} />
                ))}
              </div>
            </div>
            {storiesTrending.length > trendingRows * columns && (
              <div className="see-more-container">
                <Button 
                  variant="outline" 
                  onClick={() => setTrendingRows(prev => prev + 3)}
                  className="see-more-btn"
                >
                  Xem thêm
                </Button>
              </div>
            )}
          </>
        )}
      </section>

    </div>
  );
};
