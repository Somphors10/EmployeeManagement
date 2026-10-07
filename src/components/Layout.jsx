import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
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

const FALLBACK_NAV = [
  { key: 'dashboard', label: 'Dashboard', path: '/', status: 'LIVE' },
  { key: 'employees', label: 'Employees', path: '/employees', status: 'LIVE' },
  { key: 'leaves', label: 'Leaves', path: '/leaves', status: 'LIVE' },
  { key: 'attendance', label: 'Attendance', path: '/attendance', status: 'LIVE' },
  { key: 'payroll', label: 'Payroll', path: '/payroll', status: 'LIVE' },
  { key: 'documents', label: 'Documents', path: '/documents', status: 'LIVE' },
  { key: 'performance', label: 'Performance', path: '/performance', status: 'LIVE' },
  { key: 'organization', label: 'Organization', path: '/organization', status: 'LIVE' },
  { key: 'announcements', label: 'Announcements', path: '/announcements', status: 'LIVE' },
  { key: 'settings', label: 'Settings', path: '/settings', status: 'LIVE' },
];

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
  settings: IconSettings,
};

function toAppPath(path) {
  if (path === '/dashboard') return '/';
  return path || '/';
}

export default function Layout() {
  const location = useLocation();
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

  return (
    <div className={`app-shell ${menuOpen ? 'is-open' : ''}`}>
      <header className="mobile-bar">
        <div className="brand">
          <span className="brand-mark">EH</span>
          <h1>Employee Hub</h1>
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
            <h1>Employee Hub</h1>
          </div>
        </div>

        <nav className="side-nav">
          <p className="nav-label">Workspace</p>
          {navItems.map((item) => {
            const Icon = NAV_ICONS[item.key] || IconGrid;
            return (
              <NavLink key={item.key} to={item.path} end={item.path === '/'}>
                <Icon />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
}
