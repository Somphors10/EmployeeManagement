import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { NAV, NAV_PERMISSION } from '../auth/permissions';
import { useAuth } from '../auth/AuthContext';
import { useConfirm } from './ConfirmDialog';
import {
  IconClock,
  IconClose,
  IconFile,
  IconGrid,
  IconLeave,
  IconMegaphone,
  IconMenu,
  IconPay,
  IconPeople,
  IconSettings,
  IconStar,
} from './Icons';

const FALLBACK_NAV = NAV.map((item) => ({ ...item, status: 'LIVE' }));

const NAV_ICONS = {
  dashboard: IconGrid,
  employees: IconPeople,
  leaves: IconLeave,
  attendance: IconClock,
  payroll: IconPay,
  documents: IconFile,
  performance: IconStar,
  organization: IconPeople,
  announcements: IconMegaphone,
  overtime: IconClock,
  holidays: IconLeave,
  reports: IconPay,
  users: IconPeople,
  settings: IconSettings,
};

function toAppPath(path) {
  if (path === '/dashboard') return '/';
  return path || '/';
}

export default function Layout() {
  const location = useLocation();
  const { user, logout, can, workspace } = useAuth();
  const { ask, dialog } = useConfirm();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState(FALLBACK_NAV);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .getNavigation()
      .then((response) => {
        const items = (response.payload || []).map((item) => ({
          ...item,
          path: toAppPath(item.path),
          status: item.status === 'COMING_NEXT' ? 'LIVE' : item.status || 'LIVE',
        }));
        if (!cancelled && items.length > 0) setNavItems(items);
      })
      .catch(() => {
        if (!cancelled) setNavItems(FALLBACK_NAV);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleNav = navItems.filter((item) => can(NAV_PERMISSION[item.key] || `${item.key}:view`));

  return (
    <div className={`app-shell ${menuOpen ? 'is-open' : ''}`}>
      <header className="mobile-bar">
        <div className="brand">
          <span className="brand-mark">EH</span>
          <h1>{workspace?.companyName || 'Employee Hub'}</h1>
        </div>
        <button
          type="button"
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <IconClose /> : <IconMenu />}
        </button>
      </header>

      {menuOpen && (
        <button type="button" className="nav-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
      )}

      <aside className="sidebar">
        <div className="brand desktop-brand">
          <span className="brand-mark">EH</span>
          <div className="brand-text">
            <p className="brand-kicker">HR</p>
            <h1>{workspace?.companyName || 'Employee Hub'}</h1>
          </div>
        </div>

        <nav className="side-nav">
          <p className="nav-label">Workspace</p>
          {visibleNav.map((item) => {
            const Icon = NAV_ICONS[item.key] || IconGrid;
            return (
              <NavLink key={item.key} to={item.path} end={item.path === '/'}>
                <Icon />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-copy">
            <NavLink to="/profile" className="plain-link">
              <strong>{user?.username}</strong>
            </NavLink>
            <em>{user?.role}</em>
          </div>
          <button
            type="button"
            className="sidebar-logout"
            onClick={() =>
              ask({
                title: 'Log out',
                message: 'Log out of Employee Hub?',
                confirmLabel: 'Log out',
                onConfirm: logout,
              })
            }
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <Outlet />
      </main>
      {dialog}
    </div>
  );
}
