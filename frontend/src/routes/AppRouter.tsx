import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { HomePage } from '../pages/home/HomePage';
import { StoryDetailPage } from '../pages/story/StoryDetailPage';
import { ReaderPage } from '../pages/reader/ReaderPage';
import { StudioDashboard } from '../pages/studio/StudioDashboard';
import { CreateStoryPage } from '../pages/studio/CreateStoryPage';
import { ChapterManagementPage } from '../pages/studio/ChapterManagementPage';
import { ChapterEditorPage } from '../pages/studio/ChapterEditorPage';
import { LibraryPage } from '../pages/library/LibraryPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { ExplorePage } from '../pages/explore/ExplorePage';
import { ThemePage } from '../pages/theme/ThemePage';
import { TermsPage } from '../pages/legal/TermsPage';
import { PrivacyPage } from '../pages/legal/PrivacyPage';
import { HelpPage } from '../pages/help/HelpPage';
import { PostDetailPage } from '../pages/post/PostDetailPage';
import { ForumPage } from '../pages/forum/ForumPage';
import { useAuthStore } from '../store/authStore';
import { AdminRoute } from './AdminRoute';
import { AdminLayout } from '../pages/admin/AdminLayout';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { AdminStories } from '../pages/admin/AdminStories';
import { AdminReports } from '../pages/admin/AdminReports';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="story/:slug" element={<StoryDetailPage />} />
        <Route path="story/:slug/chapter/:chapterSlug" element={<ReaderPage />} />
        <Route path="forum" element={<ForumPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="users/:username" element={<ProfilePage />} />
        <Route path="post/:id" element={<PostDetailPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="post/:postId" element={<PostDetailPage />} />
        
        {/* Admin Routes */}
        <Route path="admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="stories" element={<AdminStories />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
        
        <Route path="profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path=":username" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />

        <Route path="library" element={
          <ProtectedRoute><LibraryPage /></ProtectedRoute>
        } />

        <Route path="settings" element={
          <ProtectedRoute><SettingsPage /></ProtectedRoute>
        } />

        <Route path="theme" element={
          <ProtectedRoute><ThemePage /></ProtectedRoute>
        } />

        {/* Studio Routes */}
        <Route path="studio" element={
          <ProtectedRoute><StudioDashboard /></ProtectedRoute>
        } />
        <Route path="studio/story/new" element={
          <ProtectedRoute><CreateStoryPage /></ProtectedRoute>
        } />
        <Route path="studio/story/:storyId/chapters" element={
          <ProtectedRoute><ChapterManagementPage /></ProtectedRoute>
        } />
        <Route path="studio/story/:storyId/chapters/:chapterId" element={
          <ProtectedRoute><ChapterEditorPage /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
};
