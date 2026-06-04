import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  const { pathname } = useLocation();
  const isReaderPage = pathname.includes('/chapter/');
  const isChapterEditorPage = /\/studio\/story\/[^/]+\/chapters\/[^/]+/.test(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const isHomeOrExplore = pathname === '/' || pathname === '/explore';
  const shouldHideFooter = isReaderPage || isChapterEditorPage;

  return (
    <div className={`app-container ${isReaderPage ? 'in-reader-page' : ''} ${isHomeOrExplore ? 'is-home-explore' : 'is-other-page'}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="ambient-glow"></div>
      <Navbar />
      <main className={`main-content fade-in ${isReaderPage ? 'reader-main-content' : ''}`} style={{ flex: 1 }}>
        <Outlet />
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};
