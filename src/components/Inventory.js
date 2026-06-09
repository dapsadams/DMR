import React, { useState, useEffect } from 'react';
import StockRemovalModal from './StockRemovalModal';
import EditPriceModal from './EditPriceModal';
import { syncMaterialsToFirebase, loadMaterialsFromFirebase, recordSaleToFirebase } from '../utils/firebaseSync';

function Inventory({ shop }) {
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0 });
  const [syncStatus, setSyncStatus] = useState('online');
  const [modal, setModal] = useState({
    active: false,
    materialId: null,
    variantIndex: null,
    reason: null
  });
  const [editPriceModal, setEditPriceModal] = useState({
    active: false,
    material: null,
    variantIndex: null
  });
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState(0);
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  const STORAGE_KEY = `materials_${shop}`;
  const CATEGORIES_KEY = `categories_${shop}`;

  // Load on mount
  useEffect(() => {
    loadMaterials();
  }, [shop]);

  // Sync when materials change (debounced)
  useEffect(() => {
    if (materials.length > 0) {
      // Save to localStorage immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
      
      // Debounce Firebase sync (wait 2 seconds before syncing)
      const syncTimeout = setTimeout(() => {
        syncToFirebase();
      }, 2000);
      
      return () => clearTimeout(syncTimeout);
    }
  }, [materials]);

  const syncToFirebase = async () => {
    try {
      setSyncStatus('syncing');
      const success = await syncMaterialsToFirebase(shop, materials);
      setSyncStatus(success ? 'online' : 'offline');
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('offline');
    }
  };

  const loadMaterials = async () => {
    try {
      setSyncStatus('syncing');
      
      // Try Firebase first
      const firebaseMaterials = await loadMaterialsFromFirebase(shop);
      
      if (firebaseMaterials && firebaseMaterials.length > 0) {
        // Firebase has data
        setMaterials(firebaseMaterials);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(firebaseMaterials));
        updateStats(firebaseMaterials);
        setSyncStatus('online');
      } else {
        // Fall back to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        const items = stored ? JSON.parse(stored) : [];
        setMaterials(items);
        updateStats(items);
        setSyncStatus('online');
      }
    } catch (error) {
      console.error('Load error:', error);
      // Use localStorage on error
      const stored = localStorage.getItem(STORAGE_KEY);
      const items = stored ? JSON.parse(stored) : [];
      setMaterials(items);
      updateStats(items);
      setSyncStatus('offline');
    }
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

  const handleEditPrice = (material, variantIndex) => {
    setEditPriceModal({
      active: true,
      material: material,
      variantIndex: variantIndex
    });
  };

  const handleSavePrice = (variantIndex, newCostPrice, newSellingPrice) => {
    const newMaterials = materials.map(m => {
      if (m.id === editPriceModal.material.id) {
        const newVariants = [...m.variants];
        newVariants[variantIndex].costPrice = newCostPrice;
        newVariants[variantIndex].sellingPrice = newSellingPrice;
        return { ...m, variants: newVariants };
      }
      return m;
    });

    setMaterials(newMaterials);
    setEditPriceModal({ active: false, material: null, variantIndex: null });
  };

  const updateStock = async (materialId, variantIndex, change, reason = 'Added') => {
    const newMaterials = materials.map(m => {
      if (m.id === materialId) {
        const newVariants = [...m.variants];
        newVariants[variantIndex].quantity = Math.max(
          0,
          newVariants[variantIndex].quantity + change
        );

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

  const recordSale = async (material, variantIndex, quantity, reason) => {
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

    const history = JSON.parse(localStorage.getItem(SALES_HISTORY_KEY) || '[]');
    history.push(saleRecord);
    localStorage.setItem(SALES_HISTORY_KEY, JSON.stringify(history));

    // Sync to Firebase
    try {
      await recordSaleToFirebase(shop, saleRecord);
    } catch (error) {
      console.error('Sale sync error:', error);
    }
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

  const toggleMaterialSelection = (materialId) => {
    setSelectedMaterials(prev =>
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  const selectAllMaterials = () => {
    if (selectedMaterials.length === filteredMaterials.length) {
      setSelectedMaterials([]);
    } else {
      setSelectedMaterials(filteredMaterials.map(m => m.id));
    }
  };

  const handleBulkSubtract = () => {
    if (selectedMaterials.length === 0) {
      alert('Please select materials first');
      return;
    }
    if (bulkQuantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    const newMaterials = materials.map(m => {
      if (selectedMaterials.includes(m.id)) {
        const newVariants = m.variants.map(v => ({
          ...v,
          quantity: Math.max(0, v.quantity - bulkQuantity)
        }));
        return { ...m, variants: newVariants };
      }
      return m;
    });

    setMaterials(newMaterials);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMaterials));
    updateStats(newMaterials);
    setSelectedMaterials([]);
    setBulkQuantity(0);
    alert(`Subtracted ${bulkQuantity} from ${selectedMaterials.length} materials!`);
  };

  const handleBulkSetStock = () => {
    if (selectedMaterials.length === 0) {
      alert('Please select materials first');
      return;
    }
    if (bulkQuantity < 0) {
      alert('Quantity cannot be negative');
      return;
    }

    const newMaterials = materials.map(m => {
      if (selectedMaterials.includes(m.id)) {
        const newVariants = m.variants.map(v => ({
          ...v,
          quantity: bulkQuantity
        }));
        return { ...m, variants: newVariants };
      }
      return m;
    });

    setMaterials(newMaterials);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMaterials));
    updateStats(newMaterials);
    setSelectedMaterials([]);
    setBulkQuantity(0);
    alert(`Set stock to ${bulkQuantity} for ${selectedMaterials.length} materials!`);
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.variants.some(v => v.color.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = ['All', ...new Set(materials.map(m => m.category))];

  const getSyncStatusDisplay = () => {
    switch (syncStatus) {
      case 'online':
        return { icon: '🟢', text: 'Synced', color: '#27ae60' };
      case 'syncing':
        return { icon: '🟡', text: 'Syncing...', color: '#f39c12' };
      case 'offline':
        return { icon: '🔴', text: 'Offline', color: '#e74c3c' };
      default:
        return { icon: '⚪', text: 'Unknown', color: '#999' };
    }
  };

  const syncDisplay = getSyncStatusDisplay();

  return (
    <>
      <div className="sync-status-bar" style={{ borderLeftColor: syncDisplay.color }}>
        <span className="sync-icon">{syncDisplay.icon}</span>
        <span className="sync-text">{syncDisplay.text}</span>
      </div>

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

      <div className="bulk-edit-section">
        <button 
          className={`bulk-toggle-btn ${bulkMode ? 'active' : ''}`}
          onClick={() => setBulkMode(!bulkMode)}
        >
          {bulkMode ? '❌ Exit Bulk Mode' : '📦 Bulk Edit Stock'}
        </button>

        {bulkMode && (
          <div className="bulk-edit-controls">
            <div className="bulk-select-all">
              <label>
                <input
                  type="checkbox"
                  checked={selectedMaterials.length === filteredMaterials.length && filteredMaterials.length > 0}
                  onChange={selectAllMaterials}
                />
                Select All ({selectedMaterials.length}/{filteredMaterials.length})
              </label>
            </div>

            <div className="bulk-actions">
              <input
                type="number"
                placeholder="Quantity"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(parseInt(e.target.value) || 0)}
                min="0"
              />
              <button onClick={handleBulkSubtract} className="bulk-subtract-btn">
                ➖ Subtract from Selected
              </button>
              <button onClick={handleBulkSetStock} className="bulk-set-btn">
                ✅ Set Stock for Selected
              </button>
            </div>
          </div>
        )}
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
                <div className="material-title-section">
                  {bulkMode && (
                    <input
                      type="checkbox"
                      checked={selectedMaterials.includes(material.id)}
                      onChange={() => toggleMaterialSelection(material.id)}
                      className="material-checkbox"
                    />
                  )}
                  <div>
                    <div className="material-title">{material.name}</div>
                    <div className="material-category">
                      {material.categoryEmoji} {material.category}
                    </div>
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
                        <div className="price-row">
                          <span>💰 Cost: ₦{variant.costPrice.toFixed(2)}</span>
                          <button
                            className="edit-price-btn"
                            onClick={() => handleEditPrice(material, idx)}
                            title="Edit price"
                          >
                            🖊️
                          </button>
                        </div>
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

      {editPriceModal.active && (
        <EditPriceModal
          material={editPriceModal.material}
          variantIndex={editPriceModal.variantIndex}
          onSave={handleSavePrice}
          onCancel={() => setEditPriceModal({ active: false, material: null, variantIndex: null })}
        />
      )}
    </>
  );
}

export default Inventory;