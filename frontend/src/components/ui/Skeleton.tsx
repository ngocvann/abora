import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  className = '',
  style,
}) => {
  const customStyle: React.CSSProperties = {
    width: width !== undefined ? width : '100%',
    height: height !== undefined ? height : '1rem',
    borderRadius: borderRadius !== undefined ? borderRadius : undefined,
    ...style,
  };

  return <span className={`skeleton ${className}`} style={customStyle} />;
};

export const StoryCardSkeleton: React.FC = () => {
  return (
    <div className="story-card-skeleton">
      <Skeleton className="story-card-skeleton-cover" />
      <div className="story-card-skeleton-info">
        <Skeleton height={18} width="85%" />
        <Skeleton height={14} width="55%" />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
  );
};

export const StoryDetailSkeleton: React.FC = () => {
  return (
    <div className="story-detail-skeleton fade-in">
      <div className="story-detail-skeleton-header">
        <Skeleton width={180} height={270} borderRadius={12} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <Skeleton height={32} width="70%" />
          <Skeleton height={20} width="40%" />
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
            <Skeleton height={40} width={80} />
            <Skeleton height={40} width={80} />
            <Skeleton height={40} width={80} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Skeleton height={42} width={130} borderRadius={20} />
            <Skeleton height={42} width={42} borderRadius={21} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
        <Skeleton height={24} width={150} />
        <Skeleton height={16} width="100%" />
        <Skeleton height={16} width="95%" />
        <Skeleton height={16} width="80%" />
      </div>
    </div>
  );
};

export const ChapterListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="chapter-item-skeleton">
          <Skeleton height={18} width="60%" />
          <Skeleton height={14} width="20%" />
        </div>
      ))}
    </div>
  );
};
