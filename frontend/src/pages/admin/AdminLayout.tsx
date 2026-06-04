import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, AlertTriangle } from 'lucide-react';

import styles from './AdminLayout.module.css';

export const AdminLayout: React.FC = () => {


  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={`${styles.brand} text-gradient`}>Abora Admin</h2>
        </div>
        
        <nav className={styles.nav}>
          <NavLink 
            to="/admin/dashboard" 
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <LayoutDashboard size={20} className="mr-2 inline-block" /> Dashboard
          </NavLink>
          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <Users size={20} className="mr-2 inline-block" /> Người dùng
          </NavLink>
          <NavLink 
            to="/admin/stories" 
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <BookOpen size={20} className="mr-2 inline-block" /> Truyện
          </NavLink>
          <NavLink 
            to="/admin/reports" 
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <AlertTriangle size={20} className="mr-2 inline-block" /> Báo cáo
          </NavLink>
        </nav>
      </aside>

      <main className={styles.mainContent}>

        <div className="fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
