import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { documentApi } from '../api/documents';
import { employeeApi } from '../api/employees';
import DocumentForm from '../components/DocumentForm';
import Modal from '../components/Modal';
import { IconPlus } from '../components/Icons';
import { useToast } from '../components/Toast';
import { formatDateTime, fullName, peopleMap, prettyEnum } from '../utils/format';

export default function Documents() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

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
      showToast('Document added');
      setCreating(false);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this document?')) return;
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
          <p className="page-copy">Store employee file metadata and open the linked files.</p>
        </div>
        <button className="button-primary" onClick={() => setCreating(true)}>
          <IconPlus /> Add document
        </button>
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
            <p>Add a file URL and document type for an employee.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const person = peopleById[doc.employeeId];
                return (
                  <tr key={doc.id}>
                    <td data-label="Title">{doc.title}</td>
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
                    <td data-label="Uploaded">{formatDateTime(doc.uploadedAt)}</td>
                    <td className="table-actions" data-label="Action">
                      {doc.fileUrl && (
                        <a className="plain-link" href={doc.fileUrl} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      )}
                      <button type="button" className="link-bad" onClick={() => remove(doc.id)} disabled={busy}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <Modal title="Add document" onClose={() => setCreating(false)}>
          <DocumentForm employees={employees} onSubmit={handleCreate} onCancel={() => setCreating(false)} busy={busy} />
        </Modal>
      )}
    </section>
  );
}
