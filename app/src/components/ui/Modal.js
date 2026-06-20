'use client';

export default function Modal({ isOpen, onClose, title, children, onConfirm, confirmText = 'Save' }) {
  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button className="btn btn-glass" onClick={onClose}>Cancel</button>
          {onConfirm && (
            <button className="btn btn-lime" onClick={onConfirm}>{confirmText}</button>
          )}
        </div>
      </div>
    </div>
  );
}
