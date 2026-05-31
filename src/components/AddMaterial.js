import React, { useState, useEffect } from 'react';
import { syncMaterials, loadCategoriesFromCloud, syncCategories } from '../utils/syncUtils';

function AddMaterial({ shop }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'yards',
    lowStockWarning: 5,
    variants: [{ color: '', colorHex: '#FF0000', quantity: 0, costPrice: 0, sellingPrice: 0 }]
  });
  const [categories, setCategories] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const STORAGE_KEY = `materials_${shop}`;
  const CATEGORIES_KEY = `categories_${shop}`;

  useEffect(() => {
    loadCategories();
  }, [shop]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const loadCategories = async () => {
    try {
      // Try cloud first
      const cloudCategories = await loadCategoriesFromCloud(shop);
      
      if (cloudCategories && cloudCategories.length > 0) {
        setCategories(cloudCategories);
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cloudCategories));
        if (!formData.category) {
          setFormData(prev => ({ ...prev, category: cloudCategories[0].name }));
        }
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(CATEGORIES_KEY);
        const cats = stored ? JSON.parse(stored) : [];
        setCategories(cats);
        if (cats.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: cats[0].name }));
        }
      }
    } catch (error) {
      console.error('Load categories error:', error);
      // Use localStorage on error
      const stored = localStorage.getItem(CATEGORIES_KEY);
      const cats = stored ? JSON.parse(stored) : [];
      setCategories(cats);
      if (cats.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: cats[0].name }));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setErrorMessage('');
    setFormData(prev => ({
      ...prev,
      [name]: name === 'lowStockWarning' ? parseInt(value) : value
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setErrorMessage('');
    const newVariants = [...formData.variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]:
        field === 'quantity' ? parseInt(value) || 0 : 
        field === 'color' ? value :
        parseFloat(value) || 0
    };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleColorChange = (index, hex) => {
    const newVariants = [...formData.variants];
    newVariants[index].colorHex = hex;
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { color: '', colorHex: '#FF0000', quantity: 0, costPrice: 0, sellingPrice: 0 }
      ]
    }));
  };

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Detailed validation
    if (!formData.name || formData.name.trim() === '') {
      setErrorMessage('❌ Material Name is required');
      return;
    }

    if (!formData.category || formData.category.trim() === '') {
      setErrorMessage('❌ Category is required');
      return;
    }

    // Check variants
    for (let i = 0; i < formData.variants.length; i++) {
      const v = formData.variants[i];
      
      if (!v.color || v.color.trim() === '') {
        setErrorMessage(`❌ Color Name is required for variant ${i + 1}`);
        return;
      }

      if (v.costPrice <= 0) {
        setErrorMessage(`❌ Cost Price must be greater than 0 for ${v.color}`);
        return;
      }

      if (v.sellingPrice <= 0) {
        setErrorMessage(`❌ Selling Price must be greater than 0 for ${v.color}`);
        return;
      }
    }

    // All validation passed
    const newMaterial = {
      id: Date.now(),
      name: formData.name,
      category: formData.category,
      categoryEmoji:
        categories.find(c => c.name === formData.category)?.emoji || '📦',
      unit: formData.unit,
      lowStockWarning: formData.lowStockWarning,
      variants: formData.variants,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    const materials = stored ? JSON.parse(stored) : [];
    materials.push(newMaterial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));

    // Sync to cloud
    try {
      await syncMaterials(shop, [newMaterial]);
    } catch (error) {
      console.error('Cloud sync error:', error);
    }

    setSuccessMessage('✅ Material added successfully!');
    setFormData({
      name: '',
      category: categories.length > 0 ? categories[0].name : '',
      unit: 'yards',
      lowStockWarning: 5,
      variants: [{ color: '', colorHex: '#FF0000', quantity: 0, costPrice: 0, sellingPrice: 0 }]
    });

    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="add-material-container">
      <h2>➕ Add New Material</h2>
      {successMessage && <div className="success-message">{successMessage}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Material Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Italian Silk, Lace Fabric, Cotton Blend"
            required
          />
        </div>

        <div className="form-group">
          <label>Category * {categories.length === 0 && <span style={{color: 'red'}}>(Create categories first!)</span>}</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Select a category --</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Unit of Measurement</label>
          <select name="unit" value={formData.unit} onChange={handleInputChange}>
            <option value="yards">Yards</option>
            <option value="rolls">Rolls</option>
            <option value="pieces">Pieces</option>
            <option value="meters">Meters</option>
          </select>
        </div>

        <div className="form-group">
          <label>Low Stock Warning Level</label>
          <input
            type="number"
            name="lowStockWarning"
            value={formData.lowStockWarning}
            onChange={handleInputChange}
            min="1"
            placeholder="e.g., 5"
          />
        </div>

        <div className="color-variants-input">
          <h3>🎨 Color Variants & Pricing</h3>
          {formData.variants.map((variant, idx) => (
            <div key={idx} className="color-variant-section">
              
              {/* Color Name */}
              <div className="form-group">
                <label>Color Name * (Variant {idx + 1})</label>
                <input
                  type="text"
                  placeholder="e.g., Red, Navy Blue, Emerald Green"
                  value={variant.color}
                  onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                  required
                />
              </div>

              {/* Color Picker */}
              <div className="form-group full-width">
                <label>🎨 Pick Color</label>
                <div className="color-picker-section">
                  <input
                    type="color"
                    value={variant.colorHex}
                    onChange={(e) => handleColorChange(idx, e.target.value)}
                  />
                  <span className="color-value">{variant.colorHex}</span>
                  <div 
                    className="color-preview-large"
                    style={{ backgroundColor: variant.colorHex }}
                  />
                </div>
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label>📦 Initial Quantity</label>
                <input
                  type="number"
                  placeholder="e.g., 50"
                  value={variant.quantity}
                  onChange={(e) => handleVariantChange(idx, 'quantity', e.target.value)}
                  min="0"
                />
              </div>

              {/* Cost Price */}
              <div className="form-group">
                <label>💰 Cost Price (₦) - What you paid *</label>
                <input
                  type="number"
                  placeholder="e.g., 1500.50"
                  value={variant.costPrice}
                  onChange={(e) => handleVariantChange(idx, 'costPrice', e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Selling Price */}
              <div className="form-group">
                <label>🏷️ Selling Price (₦) - What you charge customers *</label>
                <input
                  type="number"
                  placeholder="e.g., 2500.00"
                  value={variant.sellingPrice}
                  onChange={(e) => handleVariantChange(idx, 'sellingPrice', e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Profit Preview */}
              <div className="form-group full-width">
                <label>💵 Your Profit Per Unit (Auto-calculated)</label>
                <div className="profit-display">
                  ₦{(variant.sellingPrice - variant.costPrice).toFixed(2)}
                </div>
              </div>

              {/* Remove Button */}
              {formData.variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  className="remove-variant-btn"
                >
                  🗑️ Remove This Color
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={addVariant} className="add-color-btn">
            ➕ Add Another Color Variant
          </button>
        </div>

        <button type="submit" className="submit-btn">
          ✅ Add Material
        </button>
      </form>
    </div>
  );
}

export default AddMaterial;