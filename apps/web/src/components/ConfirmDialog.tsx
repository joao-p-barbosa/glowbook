interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Excluir",
  pending,
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-label={title} style={{ maxWidth: 420 }}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="x-close" onClick={onClose} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
        <div style={{ padding: "20px 24px", fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>
          {message}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose} disabled={pending}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={pending}
            style={{ background: "var(--err)", color: "#fff" }}
          >
            {pending ? "Excluindo…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
