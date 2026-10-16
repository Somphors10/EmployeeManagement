import { useEffect, useState } from 'react';
import { holidayApi } from '../api/holidays';
import { useAuth } from '../auth/AuthContext';
import { useConfirm } from '../components/ConfirmDialog';
import { IconHoliday, IconPlus } from '../components/Icons';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils/format';

const EMPTY_FORM = { name: '', holidayDate: '', paid: true };

export default function Holidays() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const { ask, dialog } = useConfirm();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const paidCount = items.filter((item) => item.paid).length;

  async function load() {
    setLoading(true);
    try {
      const response = await holidayApi.getAll();
      setItems(response.payload || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((err) => showToast(err.message, 'error'));
  }, [showToast]);

  function openCreate() {
    setEditingId('');
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      holidayDate: String(item.holidayDate || '').slice(0, 10),
      paid: Boolean(item.paid),
    });
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (editingId) await holidayApi.update(editingId, form);
      else await holidayApi.create(form);
      setForm(EMPTY_FORM);
      setEditingId('');
      setOpen(false);
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
          <p className="page-copy">Public holidays. Paid day means employees still receive salary.</p>
        </div>
        {can('holidays:write') && (
          <button type="button" className="button-primary" onClick={openCreate}>
            <IconPlus /> New holiday
          </button>
        )}
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Holidays</p>
            <span className="stat-icon">
              <IconHoliday />
            </span>
          </div>
          <strong>{items.length}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Paid days</p>
            <span className="stat-icon">
              <IconHoliday />
            </span>
          </div>
          <strong>{paidCount}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Unpaid days</p>
            <span className="stat-icon">
              <IconHoliday />
            </span>
          </div>
          <strong>{items.length - paidCount}</strong>
        </article>
      </div>

      <div className="table-card">
        {loading ? (
          <p className="muted padded">Loading holidays…</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>No holidays yet</h3>
            <p>Add a public holiday so leave and attendance can use it.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Paid day</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td data-label="Name">
                    <strong>{item.name}</strong>
                  </td>
                  <td className="date-cell" data-label="Date">
                    {formatDate(item.holidayDate)}
                  </td>
                  <td data-label="Paid day">{item.paid ? 'Yes' : 'No'}</td>
                  <td className="table-actions" data-label="Action">
                    {can('holidays:write') && (
                      <>
                        <button type="button" className="plain-link" onClick={() => openEdit(item)}>
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
        )}
      </div>

      {open && (
        <Modal title={editingId ? 'Edit holiday' : 'New holiday'} onClose={() => setOpen(false)}>
          <form className="employee-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>Date</span>
                <input
                  type="date"
                  value={form.holidayDate}
                  onChange={(event) => setForm((current) => ({ ...current, holidayDate: event.target.value }))}
                  required
                />
              </label>
              <label className="field checkbox-field">
                <input
                  type="checkbox"
                  checked={form.paid}
                  onChange={(event) => setForm((current) => ({ ...current, paid: event.target.checked }))}
                />
                <span>Employees are paid on this day</span>
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="button-ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button className="button-primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Save holiday' : 'Add holiday'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {dialog}
    </section>
  );
}
