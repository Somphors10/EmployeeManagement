import { useEffect, useState } from 'react';
import { settingApi } from '../api/settings';
import Modal from '../components/Modal';
import SettingForm from '../components/SettingForm';
import { IconPlus } from '../components/Icons';
import { Permission } from '../auth/permissions';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { applyWorkspaceSettings } from '../utils/workspace';

export default function Settings() {
  const { showToast } = useToast();
  const { can } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await settingApi.getAll();
      const items = response.payload || [];
      setSettings(items);
      applyWorkspaceSettings(items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave({ key, value }) {
    setBusy(true);
    try {
      await settingApi.save(key, value);
      showToast('Setting saved');
      setEditing(null);
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
          <h2>Settings</h2>
          <p className="page-copy">Create or update application keys used by the workspace.</p>
        </div>
        {can(Permission.SETTINGS_WRITE) && (
          <button className="button-primary" onClick={() => setEditing({})}>
            <IconPlus /> New setting
          </button>
        )}
      </header>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="muted padded">Loading settings…</p>
        ) : settings.length === 0 ? (
          <div className="empty-state">
            <h3>No settings yet</h3>
            <p>Add a key and value to configure the workspace.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.key}>
                  <td data-label="Key">
                    <code>{setting.key}</code>
                  </td>
                  <td data-label="Value">{setting.value}</td>
                  <td className="table-actions" data-label="Action">
                    {can(Permission.SETTINGS_WRITE) && (
                      <button
                        type="button"
                        className="plain-link"
                        onClick={async () => {
                          try {
                            const response = await settingApi.getByKey(setting.key);
                            setEditing(response.payload || setting);
                          } catch (err) {
                            showToast(err.message, 'error');
                          }
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title={editing.key ? 'Edit setting' : 'New setting'} onClose={() => setEditing(null)}>
          <SettingForm
            initial={editing.key ? editing : undefined}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
            busy={busy}
          />
        </Modal>
      )}
    </section>
  );
}
