import React, { useState, useEffect } from 'react';
import { syncCategoriesToFirebase, loadCategoriesFromFirebase } from '../utils/firebaseSync';

function CategoryManagement({ shop }) {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📦');

  const CATEGORIES_KEY = `categories_${shop}`;

  const emojis = [
    '📦',
    '🧵',
    '🎀',
    '🪢',
    '🎨',
    '✨',
    '👗',
    '🌸',
    '💎',
    '🎭',
    '🏷️',
    '🎁'
  ];

  useEffect(() => {
    loadCategories();
  }, [shop]);

  const loadCategories = async () => {
    try {
      const firebaseCategories = await loadCategoriesFromFirebase(shop);
      
      if (firebaseCategories && firebaseCategories.length > 0) {
        setCategories(firebaseCategories);
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(firebaseCategories));
      } else {
        const stored = localStorage.getItem(CATEGORIES_KEY);
        const cats = stored ? JSON.parse(stored) : [];
        setCategories(cats);
      }
    } catch (error) {
      console.error('Load categories error:', error);
      const stored = localStorage.getItem(CATEGORIES_KEY);
      const cats = stored ? JSON.parse(stored) : [];
      setCategories(cats);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === categoryName.toLowerCase())) {
      alert('Category already exists');
      return;
    }

    const newCategory = {
      name: categoryName,
      emoji: selectedEmoji,
      createdAt: new Date().toISOString()
    };

    const newCategories = [...categories, newCategory];
    setCategories(newCategories);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));

    // Sync to Firebase
    try {
      await syncCategoriesToFirebase(shop, newCategories);
    } catch (error) {
      console.error('Cloud sync error:', error);
    }

    setCategoryName('');
    setSelectedEmoji('📦');
  };

  const handleDeleteCategory = async (categoryName) => {
    if (window.confirm(`Delete category "${categoryName}"?`)) {
      const newCategories = categories.filter(c => c.name !== categoryName);
      setCategories(newCategories);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));

      try {
        await syncCategoriesToFirebase(shop, newCategories);
      } catch (error) {
        console.error('Cloud sync error:', error);
      }
    }
  };

  return (
    <div className="category-management">
      <h2>🏷️ Manage Categories</h2>

      <div className="category-input-group">
        <input
          type="text"
          placeholder="New category name (e.g., Bridal)"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
        />
      </div>

      <div>
        <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>Select Icon</h3>
        <div className="emoji-grid">
          {emojis.map(emoji => (
            <button
              key={emoji}
              className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
              onClick={() => setSelectedEmoji(emoji)}
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleAddCategory} className="add-category-btn">
        ✅ Create Category
      </button>

      <div className="categories-list">
        <h3>Current Categories ({categories.length})</h3>
        {categories.length === 0 ? (
          <p style={{ color: '#999' }}>No categories yet. Create one to get started!</p>
        ) : (
          categories.map(cat => (
            <div key={cat.name} className="category-item">
              <span>{cat.emoji} {cat.name}</span>
              <button onClick={() => handleDeleteCategory(cat.name)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CategoryManagement;