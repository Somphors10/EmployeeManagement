import { useCallback, useState } from 'react';
import Modal from './Modal';

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onCancel}>
      <p className="confirm-copy">{message}</p>
      <div className="form-actions">
        <button type="button" className="button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          className={danger ? 'button-danger' : 'button-primary'}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function useConfirm() {
  const [config, setConfig] = useState(null);
  const [busy, setBusy] = useState(false);

  const close = useCallback(() => {
    if (busy) return;
    setConfig(null);
  }, [busy]);

  const ask = useCallback((next) => {
    setConfig(next);
  }, []);

  async function handleConfirm() {
    if (!config?.onConfirm) return;
    setBusy(true);
    try {
      await config.onConfirm();
      setConfig(null);
    } finally {
      setBusy(false);
    }
  }

  const dialog = config ? (
    <ConfirmDialog
      title={config.title}
      message={config.message}
      confirmLabel={config.confirmLabel}
      danger={config.danger}
      busy={busy}
      onCancel={close}
      onConfirm={handleConfirm}
    />
  ) : null;

  return { ask, dialog };
}
