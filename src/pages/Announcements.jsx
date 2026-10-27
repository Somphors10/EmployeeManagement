import { useEffect, useState } from 'react';
import { announcementApi } from '../api/announcements';
import AnnouncementForm from '../components/AnnouncementForm';
import { useConfirm } from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import { IconPlus } from '../components/Icons';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { formatDateTime } from '../utils/format';

function dateParts(value) {
  if (!value) return { day: '—', month: '' };
  const date = new Date(value);
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleDateString(undefined, { month: 'short' }),
  };
}

export default function Announcements() {
  const { showToast } = useToast();
  const { can } = useAuth();
  const { ask, dialog } = useConfirm();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await announcementApi.getAll();
      setItems(response.payload || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(payload) {
    setBusy(true);
    try {
      if (editing?.id) await announcementApi.update(editing.id, payload);
      else await announcementApi.create(payload);
      showToast(editing?.id ? 'Announcement updated' : 'Announcement created');
      setEditing(null);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setBusy(true);
    try {
      await announcementApi.remove(id);
      showToast('Announcement deleted');
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const publishedCount = items.filter((item) => item.published).length;
  const draftCount = items.length - publishedCount;
  const visible = items.filter((item) => {
    if (filter === 'published') return item.published;
    if (filter === 'drafts') return !item.published;
    return true;
  });

  return (
    <section className="page announcements-page">
      <header className="page-header">
        <div>
          <h2>Announcements</h2>
          <p className="page-copy">Publish company updates the team can see on the dashboard.</p>
        </div>
        {can('announcements:write') && (
          <button className="button-primary" onClick={() => setEditing({})}>
            <IconPlus /> New announcement
          </button>
        )}
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <p>Total</p>
          <strong>{items.length}</strong>
        </article>
        <article className="stat-card">
          <p>Published</p>
          <strong>{publishedCount}</strong>
        </article>
        <article className="stat-card">
          <p>Drafts</p>
          <strong>{draftCount}</strong>
        </article>
      </div>

      <div className="tabs">
        {[
          ['all', 'All'],
          ['published', 'Published'],
          ['drafts', 'Drafts'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`tab ${filter === value ? 'active' : ''}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="banner banner-error">{error}</div>}
      {loading && <p className="muted padded">Loading announcements…</p>}
      {!loading && !error && visible.length === 0 && (
        <div className="empty-state">
          <h3>No announcements yet</h3>
          <p>Publish an update for the team.</p>
        </div>
      )}

      <div className="news-feed">
        {visible.map((item) => {
          const stamp = dateParts(item.createdAt);
          return (
            <article className={`news-card${item.published ? ' is-live' : ' is-draft'}`} key={item.id}>
              <div className="news-date">
                <strong>{stamp.day}</strong>
                <span>{stamp.month}</span>
              </div>
              <div className="news-body">
                <div className="news-top">
                  <h3>{item.title}</h3>
                  <span className={`status-badge ${item.published ? 'active' : 'inactive'}`}>
                    {item.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p>{item.content}</p>
                <div className="news-foot">
                  <em>{formatDateTime(item.createdAt)}</em>
                  {can('announcements:write') && (
                    <div className="table-actions">
                      <button
                        type="button"
                        className="plain-link"
                        onClick={async () => {
                          try {
                            const response = await announcementApi.getById(item.id);
                            setEditing(response.payload || item);
                          } catch (err) {
                            showToast(err.message, 'error');
                          }
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="link-bad"
                        disabled={busy}
                        onClick={() =>
                          ask({
                            title: 'Delete announcement',
                            message: `Delete “${item.title}”? This cannot be undone.`,
                            confirmLabel: 'Delete',
                            danger: true,
                            onConfirm: () => remove(item.id),
                          })
                        }
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit announcement' : 'New announcement'} onClose={() => setEditing(null)}>
          <AnnouncementForm
            initial={editing.id ? editing : undefined}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
            busy={busy}
          />
        </Modal>
      )}
      {dialog}
    </section>
  );
}
