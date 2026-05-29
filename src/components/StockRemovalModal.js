import React, { useState } from 'react';

function StockRemovalModal({ onConfirm, onCancel }) {
  const [selectedReason, setSelectedReason] = useState(null);

  return (
    <div className="modal active">
      <div className="modal-content">
        <h2>📉 Why are you removing stock?</h2>
        <p>Please select the reason for stock removal:</p>

        <div className="reason-options">
          <button
            className={`reason-btn ${selectedReason === 'Sold' ? 'selected' : ''}`}
            onClick={() => setSelectedReason('Sold')}
          >
            ✅ Sold
          </button>
          <button
            className={`reason-btn ${
              selectedReason === 'Damaged / Lost' ? 'selected' : ''
            }`}
            onClick={() => setSelectedReason('Damaged / Lost')}
          >
            ❌ Damaged / Lost
          </button>
        </div>

        <div className="modal-buttons">
          <button
            className="modal-btn confirm"
            onClick={() => selectedReason && onConfirm(selectedReason)}
            disabled={!selectedReason}
          >
            Confirm
          </button>
          <button className="modal-btn cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default StockRemovalModal;