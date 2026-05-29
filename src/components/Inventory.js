import React, { useState, useEffect } from 'react';
import StockRemovalModal from './StockRemovalModal';

function Inventory({ shop }) {
const [materials, setMaterials] = useState([]);
const [categories, setCategories] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0 });
  const [modal, setModal] = useState({
    active: false,
    materialId: null,
    variantIndex: null,
    reason: null
  });

  const STORAGE_KEY = `materials_${shop}`;
  const CATEGORIES_KEY = `categories_${shop}`;

  useEffect(() => {
    loadMaterials();
    loadCategories();
  }, [shop]);

  const loadMaterials = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const items = stored ? JSON.parse(stored) : [];
    setMaterials(items);
    updateStats(items);
  };

  const loadCategories = () => {
    const stored = localStorage.getItem(CATEGORIES_KEY);
    const cats = stored ? JSON.parse(stored) : [];
    setCategories(cats);
  };

  const updateStats = (items) => {
    let total = 0;
    let lowStock = 0;
    let outOfStock = 0;

    items.forEach(material => {
      material.variants.forEach(variant => {
        total++;
        if (variant.quantity === 0) {
          outOfStock++;
        } else if (variant.quantity <= material.lowStockWarning) {
          lowStock++;
        }
      });
    });

    setStats({ total, lowStock, outOfStock });
  };

  const handleStockChange = (materialId, variantIndex, action) => {
    if (action === 'decrease') {
      setModal({ active: true, materialId, variantIndex, reason: null });
    } else {
      updateStock(materialId, variantIndex, 1, 'Added');
    }
  };

  const updateStock = (materialId, variantIndex, change, reason = 'Added') => {
    const newMaterials = materials.map(m => {
      if (m.id === materialId) {
        const newVariants = [...m.variants];
        newVariants[variantIndex].quantity = Math.max(
          0,
          newVariants[variantIndex].quantity + change
        );

        // Record sale if stock decreased
        if (change < 0) {
          recordSale(m, variantIndex, Math.abs(change), reason);
        }

        return { ...m, variants: newVariants };
      }
      return m;
    });

    setMaterials(newMaterials);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMaterials));
    updateStats(newMaterials);
  };

  const recordSale = (material, variantIndex, quantity, reason) => {
    const SALES_KEY = `sales_${shop}`;
    const SALES_HISTORY_KEY = `salesHistory_${shop}`;

    const today = new Date().toISOString().split('T')[0];
    const sales = JSON.parse(localStorage.getItem(SALES_KEY) || '{}');

    if (!sales[today]) {
      sales[today] = [];
    }

    const variant = material.variants[variantIndex];
    const saleRecord = {
      id: Date.now(),
      materialId: material.id,
      materialName: material.name,
      variantIndex,
      color: variant.color,
      quantity,
      reason,
      costPrice: variant.costPrice,
      sellingPrice: variant.sellingPrice,
      timestamp: new Date().toISOString()
    };

    sales[today].push(saleRecord);
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));

    // Also add to history
    const history = JSON.parse(localStorage.getItem(SALES_HISTORY_KEY) || '[]');
    history.push(saleRecord);
    localStorage.setItem(SALES_HISTORY_KEY, JSON.stringify(history));
  };

  const handleDeleteMaterial = (materialId) => {
    if (window.confirm('Delete this material?')) {
      const newMaterials = materials.filter(m => m.id !== materialId);
      setMaterials(newMaterials);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMaterials));
      updateStats(newMaterials);
    }
  };

  const handleModalConfirm = (reason) => {
    updateStock(modal.materialId, modal.variantIndex, -1, reason);
    setModal({ active: false, materialId: null, variantIndex: null, reason: null });
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.variants.some(v => v.color.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = ['All', ...new Set(materials.map(m => m.category))];

  return (
    <>
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Items</h3>
          <div className="number">{stats.total}</div>
        </div>
        <div className="stat-card">
          <h3>Low Stock</h3>
          <div className="number" style={{ color: '#f39c12' }}>
            {stats.lowStock}
          </div>
        </div>
        <div className="stat-card">
          <h3>Out of Stock</h3>
          <div className="number" style={{ color: '#e74c3c' }}>
            {stats.outOfStock}
          </div>
        </div>
      </div>

      <div className="search-filter">
        <input
          type="text"
          placeholder="🔍 Search materials or colors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="category-tabs">
        {uniqueCategories.map(cat => {
          const categoryIcon =
            cat === 'All'
              ? '📦'
              : materials.find(m => m.category === cat)?.categoryEmoji || '📦';
          return (
            <button
              key={cat}
              className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {categoryIcon} {cat}
            </button>
          );
        })}
      </div>

      <div className="materials-grid">
        {filteredMaterials.length === 0 ? (
          <div className="no-data">No materials found</div>
        ) : (
          filteredMaterials.map(material => (
            <div key={material.id} className="material-card">
              <div className="material-header">
                <div>
                  <div className="material-title">{material.name}</div>
                  <div className="material-category">
                    {material.categoryEmoji} {material.category}
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteMaterial(material.id)}
                >
                  Delete
                </button>
              </div>

              <div className="color-variants">
                {material.variants.map((variant, idx) => {
                  const profit =
                    (variant.sellingPrice - variant.costPrice) * variant.quantity;
                  const stockStatus =
                    variant.quantity === 0
                      ? 'out'
                      : variant.quantity <= material.lowStockWarning
                      ? 'low'
                      : 'ok';

                  return (
                    <div key={idx} className="color-variant">
                      <div className="color-name">{variant.color}</div>
                      <div className="variant-details">
                        📏 Qty: {variant.quantity} {material.unit}
                        <br />
                        💰 Cost: ₦{variant.costPrice.toFixed(2)}
                        <br />
                        🏷️ Sell: ₦{variant.sellingPrice.toFixed(2)}
                        <br />
                        📈 Profit/Unit: ₦{(
                          variant.sellingPrice - variant.costPrice
                        ).toFixed(2)}
                        <br />
                        💵 Total Profit: ₦{profit.toFixed(2)}
                      </div>

                      <div className="stock-controls">
                        <button
                          className="stock-btn decrease"
                          onClick={() =>
                            handleStockChange(material.id, idx, 'decrease')
                          }
                        >
                          −
                        </button>
                        <div className="stock-display">{variant.quantity}</div>
                        <button
                          className="stock-btn increase"
                          onClick={() =>
                            handleStockChange(material.id, idx, 'increase')
                          }
                        >
                          +
                        </button>
                      </div>

                      <div className={`stock-status ${stockStatus}`}>
                        {stockStatus === 'ok' && '✅ In Stock'}
                        {stockStatus === 'low' && '⚠️ Low Stock'}
                        {stockStatus === 'out' && '❌ Out of Stock'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {modal.active && (
        <StockRemovalModal
          onConfirm={handleModalConfirm}
          onCancel={() =>
            setModal({
              active: false,
              materialId: null,
              variantIndex: null,
              reason: null
            })
          }
        />
      )}
    </>
  );
}

export default Inventory;