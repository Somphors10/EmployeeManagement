import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationApi } from '../api/notifications';
import { useToast } from '../components/Toast';
import { formatDateTime, prettyEnum } from '../utils/format';

export default function Notifications() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setNotes(await notificationApi.getAll());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const unread = notes.filter((note) => !note.read).length;
  const shown = filter === 'unread' ? notes.filter((note) => !note.read) : notes;

  async function markRead(id) {
    setBusyId(id);
    try {
      await notificationApi.markRead(id);
      setNotes((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
      showToast('Marked as read');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Notifications</h2>
          <p className="page-copy">Alerts for leave, documents, and other workspace events.</p>
        </div>
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <p>Total</p>
          <strong>{notes.length}</strong>
        </article>
        <article className="stat-card">
          <p>Unread</p>
          <strong>{unread}</strong>
        </article>
        <article className="stat-card">
          <p>Shown</p>
          <strong>{shown.length}</strong>
        </article>
      </div>

      <div className="tabs">
        <button type="button" className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
        <button
          type="button"
          className={`tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="muted padded">Loading notifications…</p>
        ) : shown.length === 0 ? (
          <div className="empty-state">
            <h3>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</h3>
            <p>
              {filter === 'unread'
                ? 'You’re all caught up. Switch to All to see older alerts.'
                : 'New alerts will show up here.'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Notification</th>
                <th>Type</th>
                <th>When</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((note) => (
                <tr key={note.id} className={note.read ? '' : 'is-unread-row'}>
                  <td data-label="Notification">
                    <Link
                      to={note.href}
                      className="plain-link"
                      onClick={() => {
                        if (!note.read) markRead(note.id);
                      }}
                    >
                      <strong>{note.title}</strong>
                    </Link>
                    <em className="table-sub">{note.message}</em>
                  </td>
                  <td data-label="Type">
                    <span className="profile-chip">{prettyEnum(note.kind)}</span>
                  </td>
                  <td className="date-cell" data-label="When">
                    {formatDateTime(note.createdAt)}
                  </td>
                  <td data-label="Status">
                    <span className={`status-badge ${note.read ? 'off' : 'pending'}`}>
                      {note.read ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td className="table-actions" data-label="Action">
                    {!note.read && (
                      <button
                        type="button"
                        className="plain-link"
                        disabled={busyId === note.id}
                        onClick={() => markRead(note.id)}
                      >
                        Mark read
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
