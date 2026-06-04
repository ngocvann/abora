import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReaderStore } from '../../store/readerStore';
import { Button } from '../ui/Button';
import './ReaderToolbar.css';

import { MessageCircle, Heart } from 'lucide-react';

interface ReaderToolbarProps {
  storySlug: string;
  prevChapter: number | null;
  nextChapter: number | null;
  onOpenToc: () => void;
  onOpenComments: () => void;
  onToggleLike?: () => void;
  commentCount?: number;
  likeCount?: number;
  hasLiked?: boolean;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({ 
  storySlug, prevChapter, nextChapter, onOpenToc, onOpenComments, onToggleLike, commentCount = 0, likeCount = 0, hasLiked = false
}) => {
  const { theme, setTheme, increaseFontSize, decreaseFontSize } = useReaderStore();
  const navigate = useNavigate();

  return (
    <div className="reader-toolbar glass-panel">
      <div className="toolbar-section">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={!prevChapter}
          onClick={() => prevChapter && navigate(`/story/${storySlug}/chapter/${prevChapter}`)}
        >
          &larr; Chương trước
        </Button>
        <Button variant="secondary" size="sm" onClick={onOpenToc}>
          Mục lục
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={!nextChapter}
          onClick={() => nextChapter && navigate(`/story/${storySlug}/chapter/${nextChapter}`)}
        >
          Chương sau &rarr;
        </Button>
      </div>

      <div className="toolbar-section">
        <Button 
          variant={hasLiked ? "primary" : "secondary"} 
          size="sm" 
          onClick={onToggleLike} 
          className="relative mr-2"
        >
          <Heart size={18} className="mr-2" fill={hasLiked ? "currentColor" : "none"} />
          Thích
          {likeCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {likeCount}
            </span>
          )}
        </Button>
        <Button variant="secondary" size="sm" onClick={onOpenComments} className="relative">
          <MessageCircle size={18} className="mr-2" />
          Bình luận
          {commentCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary-color text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {commentCount}
            </span>
          )}
        </Button>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-group">
          <span className="toolbar-label">Cỡ chữ</span>
          <Button variant="secondary" size="sm" onClick={decreaseFontSize}>A-</Button>
          <Button variant="secondary" size="sm" onClick={increaseFontSize}>A+</Button>
        </div>
        
        <div className="toolbar-group">
          <span className="toolbar-label">Nền</span>
          <Button 
            variant={theme === 'light' ? 'primary' : 'secondary'} 
            size="sm" 
            onClick={() => setTheme('light')}
          >
            Sáng
          </Button>
          <Button 
            variant={theme === 'sepia' ? 'primary' : 'secondary'} 
            size="sm" 
            onClick={() => setTheme('sepia')}
          >
            Vàng
          </Button>
          <Button 
            variant={theme === 'dark' ? 'primary' : 'secondary'} 
            size="sm" 
            onClick={() => setTheme('dark')}
          >
            Tối
          </Button>
        </div>
      </div>
    </div>
  );
};
