import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { documentApi } from '../api/documents';
import { employeeApi } from '../api/employees';
import { useAuth } from '../auth/AuthContext';
import { useConfirm } from '../components/ConfirmDialog';
import DocumentForm from '../components/DocumentForm';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatDateTime, formatFileSize, fullName, prettyEnum } from '../utils/format';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const { showToast } = useToast();
  const { ask, dialog } = useConfirm();
  const [doc, setDoc] = useState(null);
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await documentApi.getById(id);
      const payload = response.payload;
      setDoc(payload);
      if (payload?.employeeId) {
        try {
          const employee = await employeeApi.getById(payload.employeeId);
          setPerson(employee.payload);
        } catch {
          setPerson(null);
        }
      }
    } catch (err) {
      setError(err.message);
      setDoc(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleFile() {
    setFileBusy('download');
    try {
      await documentApi.downloadFile(id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setFileBusy('');
    }
  }

  async function handleUpdate(payload) {
    setBusy(true);
    try {
      await documentApi.update(id, payload);
      showToast('Document updated');
      setEditing(false);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="page">
        <p className="muted">Loading document…</p>
      </section>
    );
  }

  if (error || !doc) {
    return (
      <section className="page">
        <div className="banner banner-error">{error || 'Document not found'}</div>
        <Link to="/documents" className="plain-link">
          Back to documents
        </Link>
      </section>
    );
  }

  return (
    <section className="page">
      <Link to="/documents" className="back-link">
        ← Documents
      </Link>

      <header className="page-header">
        <div>
          <h2>{doc.title}</h2>
          <p className="page-copy">
            {prettyEnum(doc.documentType)}
            {person ? ` · ${fullName(person)}` : ''}
          </p>
        </div>
        <div className="header-actions">
          {doc.hasFile && (
            <button
              type="button"
              className="button-ghost"
              disabled={Boolean(fileBusy)}
              onClick={() => handleFile()}
            >
              {fileBusy === 'download' ? 'Downloading…' : 'Download'}
            </button>
          )}
          {can('documents:write') && (
            <>
              <button type="button" className="button-ghost" onClick={() => setEditing(true)}>
                Edit
              </button>
              <button
                type="button"
                className="button-danger"
                disabled={busy}
                onClick={() =>
                  ask({
                    title: 'Delete document',
                    message: `Delete “${doc.title}”? This cannot be undone.`,
                    confirmLabel: 'Delete',
                    danger: true,
                    onConfirm: async () => {
                      await documentApi.remove(id);
                      showToast('Document deleted');
                      navigate('/documents');
                    },
                  })
                }
              >
                Delete
              </button>
            </>
          )}
        </div>
      </header>

      <div className="profile-facts">
        <article className="profile-fact">
          <div>
            <p>Employee</p>
            <strong>
              {person ? <Link to={`/employees/${person.id}`}>{fullName(person)}</Link> : doc.employeeId}
            </strong>
          </div>
        </article>
        <article className="profile-fact">
          <div>
            <p>Type</p>
            <strong>{prettyEnum(doc.documentType)}</strong>
          </div>
        </article>
        <article className="profile-fact">
          <div>
            <p>File</p>
            <strong>
              {doc.hasFile
                ? `${doc.originalFileName || 'Uploaded file'} · ${formatFileSize(doc.fileSize)}`
                : 'No file'}
            </strong>
          </div>
        </article>
        <article className="profile-fact">
          <div>
            <p>Uploaded</p>
            <strong>{formatDateTime(doc.uploadedAt)}</strong>
          </div>
        </article>
      </div>

      {editing && (
        <Modal title="Edit document" onClose={() => setEditing(false)}>
          <DocumentForm
            initial={doc}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            busy={busy}
          />
        </Modal>
      )}
      {dialog}
    </section>
  );
}
