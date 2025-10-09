import React from 'react';
import './ConfirmationModal.css';

function ConfirmationModal({ show, onClose, onConfirm, title, message }) {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title || 'Confirm Action'}</h3>
        <p>{message || 'Are you sure?'}</p>
        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={onConfirm} className="btn-confirm-delete">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;