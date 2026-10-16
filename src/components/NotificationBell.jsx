import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { notificationApi } from '../api/notifications';
import { useAuth } from '../auth/AuthContext';
import { formatDateTime } from '../utils/format';
import {
  IconBell,
  IconBuilding,
  IconChart,
  IconClock,
  IconClose,
  IconFile,
  IconGrid,
  IconHoliday,
  IconLeave,
  IconMegaphone,
  IconOvertime,
  IconPay,
  IconPeople,
  IconSettings,
  IconStar,
  IconUser,
} from './Icons';

const KIND_ICONS = {
  leave: IconLeave,
  overtime: IconOvertime,
  payroll: IconPay,
  holiday: IconHoliday,
  attendance: IconClock,
  announcement: IconMegaphone,
  performance: IconStar,
  document: IconFile,
  report: IconChart,
  department: IconBuilding,
  user: IconUser,
  settings: IconSettings,
  employee: IconPeople,
  welcome: IconGrid,
  general: IconBell,
};

export default function NotificationBell() {
  const { can } = useAuth();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  function load() {
    return notificationApi
      .getAll()
      .then((list) => {
        setNotes(list);
        setError('');
      })
      .catch((err) => setError(err.message || 'Could not load notifications'));
  }

  useEffect(() => {
    if (!can('notifications:view')) return undefined;
    load();
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, [can]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('notice-open');
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('notice-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!can('notifications:view')) return null;

  const unread = notes.filter((note) => !note.read).length;

  async function markRead(id) {
    setBusyId(id);
    try {
      await notificationApi.markRead(id);
      setNotes((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } catch {
      await load();
    } finally {
      setBusyId('');
    }
  }

  function openNote(note) {
    if (!note.read) markRead(note.id);
    setOpen(false);
  }

  function openPanel() {
    setOpen(true);
    load();
  }

  return (
    <>
      <button
        type="button"
        className={`notice-bell${open ? ' is-open' : ''}`}
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <IconBell />
        {unread > 0 && <span className="notice-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open &&
        createPortal(
          <div className="notice-overlay">
            <button type="button" className="notice-backdrop" aria-label="Close notifications" onClick={() => setOpen(false)} />
            <aside className="notice-drawer" role="dialog" aria-modal="true" aria-labelledby="notice-title">
              <header className="notice-head">
                <div>
                  <h2 id="notice-title">Notifications</h2>
                  {unread > 0 && <span className="notice-count">{unread}</span>}
                </div>
                <div className="notice-head-actions">
                  <Link to="/notifications" className="notice-all" onClick={() => setOpen(false)}>
                    View all
                  </Link>
                  <button type="button" className="notice-close" onClick={() => setOpen(false)} aria-label="Close">
                    <IconClose />
                  </button>
                </div>
              </header>
              {error ? (
                <div className="notice-empty">
                  <strong>Could not load notifications</strong>
                  <p>{error}</p>
                </div>
              ) : notes.length === 0 ? (
                <div className="notice-empty">
                  <span className="dash-mark">
                    <IconBell />
                  </span>
                  <strong>No notifications yet</strong>
                  <p>New alerts will show up here.</p>
                </div>
              ) : (
                <ul className="notice-list">
                  {notes.map((note) => {
                    const Icon = KIND_ICONS[note.kind] || IconBell;
                    return (
                      <li key={note.id}>
                        <Link
                          to={note.href}
                          className={`notice-item${note.read ? '' : ' is-unread'}`}
                          onClick={() => openNote(note)}
                        >
                          <span className={`notice-icon is-${note.kind}`}>
                            <Icon />
                          </span>
                          <div>
                            <strong>{note.title}</strong>
                            <p>{note.message}</p>
                            <em>{formatDateTime(note.createdAt)}</em>
                          </div>
                        </Link>
                        {!note.read && (
                          <button
                            type="button"
                            className="notice-read"
                            disabled={busyId === note.id}
                            onClick={() => markRead(note.id)}
                          >
                            Mark read
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <footer className="notice-foot">
                <Link to="/notifications" onClick={() => setOpen(false)}>
                  See all notifications
                </Link>
              </footer>
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
