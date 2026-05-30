import React, { useState, useEffect } from 'react';

function EditPriceModal({ 
  material, 
  variantIndex, 
  onSave, 
  onCancel 
}) {
  const variant = material.variants[variantIndex];
  const [costPrice, setCostPrice] = useState(variant.costPrice);
  const [sellingPrice, setSellingPrice] = useState(variant.sellingPrice);
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    // Load price history for this variant
    const PRICE_HISTORY_KEY = `priceHistory_${material.id}_${variantIndex}`;
    const stored = localStorage.getItem(PRICE_HISTORY_KEY);
    if (stored) {
      setPriceHistory(JSON.parse(stored));
    }
  }, [material.id, variantIndex]);

  const profit = sellingPrice - costPrice;

  const handleSave = () => {
    if (costPrice <= 0 || sellingPrice <= 0) {
      alert('Cost and Selling prices must be greater than 0');
      return;
    }

    // Save to history
    const PRICE_HISTORY_KEY = `priceHistory_${material.id}_${variantIndex}`;
    const newEntry = {
      oldCostPrice: variant.costPrice,
      oldSellingPrice: variant.sellingPrice,
      newCostPrice: costPrice,
      newSellingPrice: sellingPrice,
      changedAt: new Date().toISOString(),
      changedDate: new Date().toLocaleDateString(),
      changedTime: new Date().toLocaleTimeString()
    };

    const history = priceHistory.length > 0 ? priceHistory : [];
    history.unshift(newEntry); // Add to beginning
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(history));

    // Call parent function to update material
    onSave(variantIndex, costPrice, sellingPrice);
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="modal active">
      <div className="modal-content edit-price-modal">
        <h2>🖊️ Edit Price</h2>
        
        <div className="edit-price-info">
          <p><strong>Material:</strong> {material.name}</p>
          <p><strong>Color:</strong> {variant.color}</p>
        </div>

        <div className="edit-price-form">
          <div className="form-group">
            <label>💰 Cost Price (₦) - What you paid</label>
            <input
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>🏷️ Selling Price (₦) - What you charge</label>
            <input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group profit-section">
            <label>💵 Your Profit Per Unit</label>
            <div className="profit-display">
              ₦{profit.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Price History */}
        {priceHistory.length > 0 && (
          <div className="price-history">
            <h4>📜 Price Change History</h4>
            <div className="history-list">
              {priceHistory.slice(0, 3).map((entry, idx) => (
                <div key={idx} className="history-item">
                  <div className="history-date">
                    {entry.changedDate} at {entry.changedTime}
                  </div>
                  <div className="history-prices">
                    <span>Cost: ₦{entry.oldCostPrice.toFixed(2)} → ₦{entry.newCostPrice.toFixed(2)}</span>
                  </div>
                  <div className="history-prices">
                    <span>Sell: ₦{entry.oldSellingPrice.toFixed(2)} → ₦{entry.newSellingPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {priceHistory.length > 3 && (
                <div className="history-more">
                  ...and {priceHistory.length - 3} more changes
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Change Info */}
        {priceHistory.length > 0 && (
          <div className="last-edit-info">
            Last edited: {formatDateTime(priceHistory[0].changedAt)}
          </div>
        )}

        <div className="modal-buttons">
          <button className="modal-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-btn confirm save-price-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditPriceModal;