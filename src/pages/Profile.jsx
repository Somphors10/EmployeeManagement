import { useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { notificationApi } from '../api/notifications';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { formatDateTime } from '../utils/format';

export default function Profile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [notes, setNotes] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    notificationApi
      .getAll()
      .then((response) => setNotes(response.payload || []))
      .catch(() => {});
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await authApi.changePassword(form.currentPassword, form.newPassword);
      showToast('Password changed');
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>My profile</h2>
          <p className="page-copy">
            Signed in as {user?.username} ({user?.role}).
          </p>
        </div>
      </header>
      <form className="employee-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Current password</span>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>New password</span>
            <input
              type="password"
              minLength={6}
              value={form.newPassword}
              onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
              required
            />
          </label>
        </div>
        <div className="form-actions">
          <button className="button-primary" type="submit" disabled={busy}>
            Change password
          </button>
        </div>
      </form>
      <div className="table-card">
        <h3 className="padded">Notifications</h3>
        {(notes || []).length === 0 ? (
          <p className="muted padded">No notifications yet.</p>
        ) : (
          <table className="data-table">
            <tbody>
              {notes.map((note) => (
                <tr key={note.id}>
                  <td>
                    <strong>{note.title}</strong>
                    <div className="muted">{note.message}</div>
                  </td>
                  <td>{formatDateTime(note.createdAt)}</td>
                  <td>
                    {!note.read && (
                      <button
                        type="button"
                        className="plain-link"
                        onClick={() =>
                          notificationApi.markRead(note.id).then(() =>
                            setNotes((current) =>
                              current.map((item) => (item.id === note.id ? { ...item, read: true } : item)),
                            ),
                          )
                        }
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
