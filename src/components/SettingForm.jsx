import { useState } from 'react';

export default function SettingForm({ initial, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState({
    key: initial?.key || '',
    value: initial?.value || '',
  });
  const [errors, setErrors] = useState({});

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.key.trim()) nextErrors.key = 'Key is required';
    if (!form.value.trim()) nextErrors.value = 'Value is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      key: form.key.trim(),
      value: form.value.trim(),
    });
  }

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Key</span>
          <input
            name="key"
            value={form.key}
            onChange={updateField}
            placeholder="company.name"
            disabled={Boolean(initial)}
          />
          {errors.key && <small>{errors.key}</small>}
        </label>
        <label className="field">
          <span>Value</span>
          <input name="value" value={form.value} onChange={updateField} placeholder="Employee Hub" />
          {errors.value && <small>{errors.value}</small>}
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? 'Saving…' : initial ? 'Update setting' : 'Save setting'}
        </button>
      </div>
    </form>
  );
}
