export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="admin-modal-backdrop"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="admin-modal confirm-dialog"
        onClick={(event) =>
          event.stopPropagation()
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h2 id="confirm-dialog-title">
          {title}
        </h2>

        <p>{message}</p>

        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={
              danger
                ? "delete-button"
                : "admin-primary-button"
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}