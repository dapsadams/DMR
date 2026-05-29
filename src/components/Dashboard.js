import React, { useState, useEffect } from 'react';
import Inventory from './Inventory';
import AddMaterial from './AddMaterial';
import CategoryManagement from './CategoryManagement';
import SalesReport from './SalesReport';

function Dashboard({ onLogout }) {
  const [currentTab, setCurrentTab] = useState('inventory');
  const [currentShop, setCurrentShop] = useState(
    localStorage.getItem('currentShop') || 'DMR BOUTIQUE POWER LINE'
  );

  useEffect(() => {
    localStorage.setItem('currentShop', currentShop);
  }, [currentShop]);

  return (
    <div className="main-container">
      <div className="header">
        <h1>🧵 DMR BOUTIQUE</h1>
        <p>Tailoring Materials Inventory System</p>
        <div className="shop-selector">
          <button 
            className={`shop-btn ${currentShop === 'DMR BOUTIQUE POWER LINE' ? 'active' : ''}`}
            onClick={() => setCurrentShop('DMR BOUTIQUE POWER LINE')}
          >
            📍 POWER LINE
          </button>
          <button 
            className={`shop-btn ${currentShop === 'DMR BOUTIQUE J&P' ? 'active' : ''}`}
            onClick={() => setCurrentShop('DMR BOUTIQUE J&P')}
          >
            📍 J&P
          </button>
        </div>
      </div>

      <div className="nav-tabs">
        <button 
          className={`nav-btn ${currentTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setCurrentTab('inventory')}
        >
          📦 Inventory
        </button>
        <button 
          className={`nav-btn ${currentTab === 'add' ? 'active' : ''}`}
          onClick={() => setCurrentTab('add')}
        >
          ➕ Add Material
        </button>
        <button 
          className={`nav-btn ${currentTab === 'categories' ? 'active' : ''}`}
          onClick={() => setCurrentTab('categories')}
        >
          🏷️ Categories
        </button>
        <button 
          className={`nav-btn ${currentTab === 'sales' ? 'active' : ''}`}
          onClick={() => setCurrentTab('sales')}
        >
          📊 Sales Report
        </button>
        <button className="logout-btn" onClick={onLogout}>
          🚪 Logout
        </button>
      </div>

      <div className="content">
        {currentTab === 'inventory' && <Inventory shop={currentShop} />}
        {currentTab === 'add' && <AddMaterial shop={currentShop} />}
        {currentTab === 'categories' && <CategoryManagement shop={currentShop} />}
        {currentTab === 'sales' && <SalesReport shop={currentShop} />}
      </div>
    </div>
  );
}

export default Dashboard;