import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { documentApi } from '../api/documents';
import { employeeApi } from '../api/employees';
import { useConfirm } from '../components/ConfirmDialog';
import DocumentForm from '../components/DocumentForm';
import Modal from '../components/Modal';
import { IconPlus } from '../components/Icons';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { formatDateTime, formatFileSize, fullName, peopleMap, prettyEnum } from '../utils/format';

export default function Documents() {
  const { showToast } = useToast();
  const { can } = useAuth();
  const { ask, dialog } = useConfirm();
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState('');

  const peopleById = useMemo(() => peopleMap(employees), [employees]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [docRes, peopleRes] = await Promise.all([
        documentApi.getAll(employeeId || undefined),
        employeeApi.getAll(),
      ]);
      setDocuments(docRes.payload || []);
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
      await documentApi.create(payload);
      showToast('Document uploaded');
      setCreating(false);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function startEdit(id) {
    setBusy(true);
    try {
      const response = await documentApi.getById(id);
      setEditing(response.payload);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(payload) {
    setBusy(true);
    try {
      await documentApi.update(editing.id, payload);
      showToast('Document updated');
      setEditing(null);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(doc) {
    setFileBusy(`download-${doc.id}`);
    try {
      await documentApi.downloadFile(doc.id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setFileBusy('');
    }
  }

  async function remove(id) {
    setBusy(true);
    try {
      await documentApi.remove(id);
      showToast('Document deleted');
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
          <h2>Documents</h2>
          <p className="page-copy">Upload, open, update, and delete employee files.</p>
        </div>
        {can('documents:write') && (
          <button className="button-primary" onClick={() => setCreating(true)}>
            <IconPlus /> Add document
          </button>
        )}
      </header>

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
          <p className="muted padded">Loading documents…</p>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <h3>No documents yet</h3>
            <p>Upload a PDF, image, or Word file for an employee.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Employee</th>
                <th>Type</th>
                <th>File</th>
                <th>Uploaded</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const person = peopleById[doc.employeeId];
                return (
                  <tr key={doc.id}>
                    <td data-label="Title">
                      <Link to={`/documents/${doc.id}`} className="plain-link">
                        {doc.title}
                      </Link>
                    </td>
                    <td data-label="Employee">
                      {person ? (
                        <Link to={`/employees/${person.id}`} className="plain-link">
                          {fullName(person)}
                        </Link>
                      ) : (
                        doc.employeeId
                      )}
                    </td>
                    <td data-label="Type">
                      <span className="status-badge">{prettyEnum(doc.documentType)}</span>
                    </td>
                    <td data-label="File">
                      {doc.hasFile
                        ? `${doc.originalFileName || 'File'} · ${formatFileSize(doc.fileSize)}`
                        : 'No file'}
                    </td>
                    <td data-label="Uploaded">{formatDateTime(doc.uploadedAt)}</td>
                    <td className="table-actions" data-label="Action">
                      {doc.hasFile && (
                        <>
                          <Link to={`/documents/${doc.id}`} className="plain-link">
                            Open
                          </Link>
                          <button
                            type="button"
                            className="plain-link"
                            disabled={fileBusy === `download-${doc.id}`}
                            onClick={() => handleFile(doc)}
                          >
                            {fileBusy === `download-${doc.id}` ? 'Saving…' : 'Download'}
                          </button>
                        </>
                      )}
                      {can('documents:write') && (
                        <button type="button" className="plain-link" onClick={() => startEdit(doc.id)}>
                          Edit
                        </button>
                      )}
                      {can('documents:write') && (
                        <button
                          type="button"
                          className="link-bad"
                          disabled={busy}
                          onClick={() =>
                            ask({
                              title: 'Delete document',
                              message: `Delete “${doc.title}”? This cannot be undone.`,
                              confirmLabel: 'Delete',
                              danger: true,
                              onConfirm: () => remove(doc.id),
                            })
                          }
                        >
                          Delete
                        </button>
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
        <Modal title="Upload document" onClose={() => setCreating(false)}>
          <DocumentForm employees={employees} onSubmit={handleCreate} onCancel={() => setCreating(false)} busy={busy} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit document" onClose={() => setEditing(null)}>
          <DocumentForm
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
