import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import "./ConfirmDialog.css";

export default function ConfirmDialog({
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "warning",
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="confirm-dialog__backdrop" onClick={handleBackdropClick}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true">
        <div className="confirm-dialog__content">
          <div className={`confirm-dialog__icon confirm-dialog__icon--${variant}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="confirm-dialog__text">
            <p className="confirm-dialog__message">{message}</p>
          </div>
        </div>

        <div className="confirm-dialog__actions">
          <button
            className="confirm-dialog__btn confirm-dialog__btn--secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            className={`confirm-dialog__btn confirm-dialog__btn--${variant}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
