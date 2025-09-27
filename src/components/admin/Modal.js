import React from 'react';
import './Modal.css';

const Modal = ({ show, onClose, title, children }) => {
  if (!show) {
    return null;
  }

  // Evita que el clic dentro del modal lo cierre
  const handleContentClick = (e) => e.stopPropagation();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleContentClick}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;