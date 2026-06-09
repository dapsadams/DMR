import React, { useState } from 'react';

function EditPriceModal({ material, variantIndex, onSave, onCancel }) {
  const variant = material.variants[variantIndex];
  const [costPrice, setCostPrice] = useState(variant.costPrice);
  const [sellingPrice, setSellingPrice] = useState(variant.sellingPrice);

  const profit = sellingPrice - costPrice;

  const handleSave = () => {
    if (costPrice <= 0 || sellingPrice <= 0) {
      alert('Prices must be greater than 0');
      return;
    }
    onSave(variantIndex, parseFloat(costPrice), parseFloat(sellingPrice));
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <h2>🖊️ Edit Price</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Material: <strong>{material.name}</strong> - <strong>{variant.color}</strong>
        </p>

        <div className="form-group">
          <label>💰 Cost Price (₦)</label>
          <input
            type="number"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            step="0.01"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>🏷️ Selling Price (₦)</label>
          <input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            step="0.01"
            min="0"
          />
        </div>

        <div style={{
          background: '#e8f5e9',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #27ae60'
        }}>
          <p style={{ fontSize: '12px', color: '#555', marginBottom: '5px' }}>Profit Per Unit:</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
            ₦{profit.toFixed(2)}
          </p>
        </div>

        <div className="modal-buttons">
          <button className="modal-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-btn confirm" onClick={handleSave} style={{ background: '#27ae60' }}>
            Save Price
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditPriceModal;