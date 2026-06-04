import React from "react";
import { Link } from "react-router-dom";
import type { Story } from "../../types/story";
import "./StoryCard.css";

interface StoryCardProps {
  story: Story;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  // We use placehold.co to avoid missing image errors if the db has null
  const fallbackCover = "https://placehold.co/400x600/1a1a24/8b5cf6?text=Abora";

  return (
    <Link to={`/story/${story.id}-${story.slug}`} className="story-card fade-in">
      <div className="story-cover-wrapper">
        <img
          src={story.coverImageUrl || fallbackCover}
          alt={`Bìa truyện ${story.title}`}
          className="story-cover"
          loading="lazy"
        />
        <div className="story-overlay">
          <span className="story-status">
            {story.status === "COMPLETED" ? "Hoàn thành" : "Đang ra"}
          </span>
          <span className="story-chapters">{story.chapterCount} Chương</span>
        </div>
      </div>
      <div className="story-info">
        <h3 className="story-title" title={story.title}>
          {story.title}
        </h3>
        <p className="story-author">{story.authorName}</p>
        <div className="story-stats">
          <span>👁 {story.viewCount.toLocaleString()}</span>
          <span>★ {story.followCount.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
};
