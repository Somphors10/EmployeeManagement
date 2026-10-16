import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { NAV, NAV_PERMISSION } from '../auth/permissions';
import { useAuth } from '../auth/AuthContext';
import AccountMenu from './AccountMenu';
import { useConfirm } from './ConfirmDialog';
import NotificationBell from './NotificationBell';
import {
  IconBuilding,
  IconChart,
  IconChevron,
  IconClock,
  IconClose,
  IconFile,
  IconGrid,
  IconHoliday,
  IconLeave,
  IconBell,
  IconMegaphone,
  IconMenu,
  IconOvertime,
  IconPay,
  IconPeople,
  IconSettings,
  IconStar,
  IconUser,
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
  organization: IconBuilding,
  announcements: IconMegaphone,
  notifications: IconBell,
  overtime: IconOvertime,
  holidays: IconHoliday,
  reports: IconChart,
  users: IconUser,
  roles: IconUser,
  settings: IconSettings,
};

const NAV_GROUPS = [
  { label: 'Overview', keys: ['dashboard'] },
  { label: 'People', keys: ['employees', 'organization', 'users'] },
  { label: 'Time', keys: ['leaves', 'attendance', 'overtime', 'holidays'] },
  { label: 'Work', keys: ['payroll', 'documents', 'performance', 'announcements', 'notifications'] },
  { label: 'Admin', keys: ['reports', 'roles', 'settings'] },
];

function toAppPath(path) {
  if (path === '/dashboard') return '/';
  return path || '/';
}

export default function Layout() {
  const location = useLocation();
  const { user, logout, can, workspace } = useAuth();
  const { ask, dialog } = useConfirm();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === '1');
  const [navItems, setNavItems] = useState(FALLBACK_NAV);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  }

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
          permission: NAV_PERMISSION[item.key] || item.permission,
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

  const visibleNav = navItems.filter((item) =>
    can(NAV_PERMISSION[item.key] || item.permission || `${item.key}:view`),
  );
  const groupedNav = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.keys
      .map((key) => visibleNav.find((item) => item.key === key))
      .filter(Boolean),
  })).filter((group) => group.items.length > 0);
  const groupedKeys = new Set(NAV_GROUPS.flatMap((group) => group.keys));
  const extraNav = visibleNav.filter((item) => !groupedKeys.has(item.key));
  if (extraNav.length > 0) groupedNav.push({ label: 'More', items: extraNav });

  return (
    <div className={`app-shell ${menuOpen ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
      {menuOpen && (
        <button type="button" className="nav-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
      )}

      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">EH</span>
          <div className="brand-text">
            <h1>{workspace?.companyName || 'Employee Hub'}</h1>
            <p className="brand-kicker">HR workspace</p>
          </div>
        </div>

        <nav className="side-nav">
          {groupedNav.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-label">{group.label}</p>
              {group.items.map((item) => {
                const Icon = NAV_ICONS[item.key] || IconGrid;
                return (
                  <NavLink key={item.key} to={item.path} end={item.path === '/'} title={item.label}>
                    <span className="nav-icon">
                      <Icon />
                    </span>
                    <span className="nav-text">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div className="topbar-start">
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <IconClose /> : <IconMenu />}
            </button>
            <button
              type="button"
              className="sidebar-toggle"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
              title={collapsed ? 'Open sidebar' : 'Close sidebar'}
            >
              <IconChevron />
            </button>
          </div>
          <div className="topbar-end">
            <NotificationBell />
            <AccountMenu
              user={user}
              onLogout={() =>
                ask({
                  title: 'Log out',
                  message: 'Log out of Employee Hub?',
                  confirmLabel: 'Log out',
                  onConfirm: logout,
                })
              }
            />
          </div>
        </header>

        <main className="main-area">
          <Outlet />
        </main>
      </div>
      {dialog}
    </div>
  );
}
