import { useEffect, useState } from 'react';
import { holidayApi } from '../api/holidays';
import { useAuth } from '../auth/AuthContext';
import { useConfirm } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils/format';

export default function Holidays() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const { ask, dialog } = useConfirm();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', holidayDate: '', paid: true });
  const [editingId, setEditingId] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await holidayApi.getAll();
    setItems(response.payload || []);
  }

  useEffect(() => {
    load().catch((err) => showToast(err.message, 'error'));
  }, [showToast]);

  async function handleCreate(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (editingId) await holidayApi.update(editingId, form);
      else await holidayApi.create(form);
      setForm({ name: '', holidayDate: '', paid: true });
      setEditingId('');
      await load();
      showToast(editingId ? 'Holiday updated' : 'Holiday added');
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
          <h2>Holidays</h2>
          <p className="page-copy">Company public holidays used for leave and attendance.</p>
        </div>
      </header>
      {can('holidays:write') && (
        <form className="filter-bar" onSubmit={handleCreate}>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Holiday name"
            required
          />
          <input
            type="date"
            value={form.holidayDate}
            onChange={(event) => setForm((current) => ({ ...current, holidayDate: event.target.value }))}
            required
          />
          <button className="button-primary" type="submit" disabled={busy}>
            {editingId ? 'Save' : 'Add'}
          </button>
        </form>
      )}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Paid</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{formatDate(item.holidayDate)}</td>
                <td>{item.paid ? 'Yes' : 'No'}</td>
                <td className="table-actions">
                  {can('holidays:write') && (
                    <>
                      <button
                        type="button"
                        className="plain-link"
                        onClick={() => {
                          setEditingId(item.id);
                          setForm({
                            name: item.name || '',
                            holidayDate: item.holidayDate || '',
                            paid: Boolean(item.paid),
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="link-bad"
                        onClick={() =>
                          ask({
                            title: 'Delete holiday',
                            message: `Delete ${item.name}?`,
                            confirmLabel: 'Delete',
                            danger: true,
                            onConfirm: () =>
                              holidayApi
                                .remove(item.id)
                                .then(() => load())
                                .catch((err) => showToast(err.message, 'error')),
                          })
                        }
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dialog}
    </section>
  );
}
