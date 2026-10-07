import { useState } from 'react';

export default function AnnouncementForm({ initial, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    content: initial?.content || '',
    published: initial?.published ?? true,
  });
  const [errors, setErrors] = useState({});

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required';
    if (!form.content.trim()) nextErrors.content = 'Content is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      title: form.title.trim(),
      content: form.content.trim(),
      published: form.published,
    });
  }

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field field-wide">
          <span>Title</span>
          <input name="title" value={form.title} onChange={updateField} placeholder="Office closed Friday" />
          {errors.title && <small>{errors.title}</small>}
        </label>
        <label className="field field-wide">
          <span>Content</span>
          <input
            name="content"
            value={form.content}
            onChange={updateField}
            placeholder="Share the update the team should see."
          />
          {errors.content && <small>{errors.content}</small>}
        </label>
        <label className="field field-wide checkbox-field">
          <input name="published" type="checkbox" checked={form.published} onChange={updateField} />
          <span>Published</span>
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? 'Saving…' : initial ? 'Update announcement' : 'Publish announcement'}
        </button>
      </div>
    </form>
  );
}
