import { useState } from 'react';
import { fullName, todayISO } from '../utils/format';

export default function ReviewForm({ employees = [], onSubmit, onCancel, busy }) {
  const [form, setForm] = useState({
    employeeId: '',
    reviewer: '',
    rating: '4',
    comments: '',
    reviewDate: todayISO(),
  });
  const [errors, setErrors] = useState({});

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.employeeId) nextErrors.employeeId = 'Employee is required';
    if (!form.reviewer.trim()) nextErrors.reviewer = 'Reviewer is required';
    if (!form.rating) nextErrors.rating = 'Rating is required';
    if (!form.comments.trim()) nextErrors.comments = 'Comments are required';
    if (!form.reviewDate) nextErrors.reviewDate = 'Review date is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      employeeId: form.employeeId,
      reviewer: form.reviewer.trim(),
      rating: Number(form.rating),
      comments: form.comments.trim(),
      reviewDate: form.reviewDate,
    });
  }

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field field-wide">
          <span>Employee</span>
          <select name="employeeId" value={form.employeeId} onChange={updateField}>
            <option value="">Select an employee</option>
            {employees.map((person) => (
              <option key={person.id} value={person.id}>
                {fullName(person)}
              </option>
            ))}
          </select>
          {errors.employeeId && <small>{errors.employeeId}</small>}
        </label>
        <label className="field">
          <span>Reviewer</span>
          <input name="reviewer" value={form.reviewer} onChange={updateField} placeholder="Alex Chen" />
          {errors.reviewer && <small>{errors.reviewer}</small>}
        </label>
        <label className="field">
          <span>Rating</span>
          <select name="rating" value={form.rating} onChange={updateField}>
            {[1, 2, 3, 4, 5].map((score) => (
              <option key={score} value={score}>
                {score} / 5
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Review date</span>
          <input name="reviewDate" type="date" value={form.reviewDate} onChange={updateField} />
          {errors.reviewDate && <small>{errors.reviewDate}</small>}
        </label>
        <label className="field field-wide">
          <span>Comments</span>
          <input
            name="comments"
            value={form.comments}
            onChange={updateField}
            placeholder="Strong delivery this quarter, keep growing the team."
          />
          {errors.comments && <small>{errors.comments}</small>}
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save review'}
        </button>
      </div>
    </form>
  );
}
