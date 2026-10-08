import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { performanceApi } from '../api/performance';
import { useConfirm } from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import ReviewForm from '../components/ReviewForm';
import { IconPlus } from '../components/Icons';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { formatDate, fullName, peopleMap } from '../utils/format';

export default function Performance() {
  const { showToast } = useToast();
  const { can } = useAuth();
  const { ask, dialog } = useConfirm();
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const peopleById = useMemo(() => peopleMap(employees), [employees]);
  const average =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [reviewRes, peopleRes] = await Promise.all([
        performanceApi.getAll(employeeId || undefined),
        employeeApi.getAll(),
      ]);
      setReviews(reviewRes.payload || []);
      setEmployees(peopleRes.payload || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  async function handleCreate(payload) {
    setBusy(true);
    try {
      await performanceApi.create(payload);
      showToast('Review saved');
      setCreating(false);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(payload) {
    if (!editing) return;
    setBusy(true);
    try {
      await performanceApi.update(editing.id, payload);
      showToast('Review updated');
      setEditing(null);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    setBusy(true);
    try {
      await performanceApi.remove(id);
      showToast('Review deleted');
      await load();
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
          <h2>Performance</h2>
          <p className="page-copy">Record reviews and keep a running view of ratings.</p>
        </div>
        {can('performance:write') && (
          <button className="button-primary" onClick={() => setCreating(true)}>
            <IconPlus /> New review
          </button>
        )}
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <p>Reviews</p>
          <strong>{reviews.length}</strong>
        </article>
        <article className="stat-card">
          <p>Average rating</p>
          <strong>{reviews.length ? average.toFixed(1) : '—'}</strong>
        </article>
      </div>

      <div className="filter-bar">
        <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
          <option value="">All employees</option>
          {employees.map((person) => (
            <option key={person.id} value={person.id}>
              {fullName(person)}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="muted padded">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <h3>No reviews yet</h3>
            <p>Add a rating and comments for an employee.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Date</th>
                <th>Comments</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => {
                const person = peopleById[review.employeeId];
                return (
                  <tr key={review.id}>
                    <td data-label="Employee">
                      {person ? (
                        <Link to={`/employees/${person.id}`} className="plain-link">
                          {fullName(person)}
                        </Link>
                      ) : (
                        review.employeeId
                      )}
                    </td>
                    <td data-label="Reviewer">{review.reviewer}</td>
                    <td data-label="Rating">{review.rating} / 5</td>
                    <td data-label="Date">{formatDate(review.reviewDate)}</td>
                    <td data-label="Comments">{review.comments}</td>
                    <td className="table-actions" data-label="Action">
                      {can('performance:write') && (
                        <>
                          <button
                            type="button"
                            className="plain-link"
                            onClick={async () => {
                              try {
                                const response = await performanceApi.getById(review.id);
                                setEditing(response.payload || review);
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
                                title: 'Delete review',
                                message: `Delete this review${person ? ` for ${fullName(person)}` : ''}?`,
                                confirmLabel: 'Delete',
                                danger: true,
                                onConfirm: () => handleDelete(review.id),
                              })
                            }
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <Modal title="New review" onClose={() => setCreating(false)}>
          <ReviewForm employees={employees} onSubmit={handleCreate} onCancel={() => setCreating(false)} busy={busy} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit review" onClose={() => setEditing(null)}>
          <ReviewForm
            employees={employees}
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            busy={busy}
          />
        </Modal>
      )}
      {dialog}
    </section>
  );
}
