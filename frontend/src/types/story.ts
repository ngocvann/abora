export interface PaginatedResponse<T> {
  content: T[];
  pageable: any;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface Story {
  id: number;
  title: string;
  slug: string;
  description: string;
  authorId: number;
  authorName: string;
  coverImageUrl: string | null;
  authorAvatarUrl?: string | null;
  status: string;
  wordCount: number;
  viewCount: number;
  followCount: number;
  favoriteCount: number;
  commentCount: number;
  chapterCount: number;
  createdAt: string;
  updatedAt: string;
  latestChapterNumber?: number | null;
  latestChapterTitle?: string | null;
  publishedChapterCount?: number;
  draftChapterCount?: number;
  categories?: { id: number; name: string; slug: string; description: string }[];
  tags?: { id: number; name: string; slug: string }[];
  visibility?: string;
  ageRating?: string | null;
  contentWarning?: string | null;
}

export interface TocChapter {
  id: number;
  chapterNumber: number;
  slug: string;
  title: string;
  publishedAt: string | null;
  wordCount: number;
}

export interface PublicStoryDetail extends Story {
  authorUsername: string;
  categories: any[];
  tags: any[];
  chapters: TocChapter[];
}

export interface ReadChapterResponse {
  id: number;
  storyId: number;
  title: string;
  chapterNumber: number;
  slug: string;
  content: string;
  wordCount: number;
  estimatedReadingTime: number;
  publishedAt: string | null;
  prevChapterSlug: string | null;
  nextChapterSlug: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
  lastReadPosition?: number;
}
