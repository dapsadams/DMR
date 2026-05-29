import React, { useState, useEffect } from 'react';

function AddMaterial({ shop }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'yards',
    lowStockWarning: 5,
    variants: [{ color: '', quantity: 0, costPrice: 0, sellingPrice: 0 }]
  });
  const [categories, setCategories] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const STORAGE_KEY = `materials_${shop}`;
  const CATEGORIES_KEY = `categories_${shop}`;

  useEffect(() => {
  loadCategories();
}, [shop, formData.category]);

  const loadCategories = () => {
    const stored = localStorage.getItem(CATEGORIES_KEY);
    const cats = stored ? JSON.parse(stored) : [];
    setCategories(cats);
    if (cats.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: cats[0].name }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'lowStockWarning' ? parseInt(value) : value
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]:
        field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0
    };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { color: '', quantity: 0, costPrice: 0, sellingPrice: 0 }
      ]
    }));
  };

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.category ||
      formData.variants.some(v => !v.color)
    ) {
      alert('Please fill all required fields');
      return;
    }

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

    const stored = localStorage.getItem(STORAGE_KEY);
    const materials = stored ? JSON.parse(stored) : [];
    materials.push(newMaterial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));

    setSuccessMessage('✅ Material added successfully!');
    setFormData({
      name: '',
      category: categories.length > 0 ? categories[0].name : '',
      unit: 'yards',
      lowStockWarning: 5,
      variants: [{ color: '', quantity: 0, costPrice: 0, sellingPrice: 0 }]
    });

    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="add-material-container">
      <h2>➕ Add New Material</h2>
      {successMessage && <div className="success-message">{successMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Material Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Italian Silk"
            required
          />
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
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
          />
        </div>

        <div className="color-variants-input">
          <h3>Color Variants & Pricing</h3>
          {formData.variants.map((variant, idx) => (
            <div key={idx} className="color-input-group">
              <input
                type="text"
                placeholder="Color name"
                value={variant.color}
                onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Initial Qty"
                value={variant.quantity}
                onChange={(e) => handleVariantChange(idx, 'quantity', e.target.value)}
                min="0"
              />
              <input
                type="number"
                placeholder="Cost Price (₦)"
                value={variant.costPrice}
                onChange={(e) =>
                  handleVariantChange(idx, 'costPrice', e.target.value)
                }
                min="0"
                step="0.01"
              />
              <input
                type="number"
                placeholder="Selling Price (₦)"
                value={variant.sellingPrice}
                onChange={(e) =>
                  handleVariantChange(idx, 'sellingPrice', e.target.value)
                }
                min="0"
                step="0.01"
              />
              {formData.variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  style={{ background: '#e74c3c', color: 'white' }}
                >
                  Remove Color
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addVariant} className="add-color-btn">
            + Add Another Color
          </button>
        </div>

        <button type="submit" className="submit-btn">
          Add Material
        </button>
      </form>
    </div>
  );
}

export default AddMaterial;