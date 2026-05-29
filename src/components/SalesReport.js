import React, { useState, useEffect } from 'react';

function SalesReport({ shop }) {
  const [salesHistory, setSalesHistory] = useState([]);
  const [reportType, setReportType] = useState('today');
  const [filteredData, setFilteredData] = useState([]);
  const [summary, setSummary] = useState({
    unitsSold: 0,
    revenue: 0,
    cost: 0,
    profit: 0
  });

  const SALES_HISTORY_KEY = `salesHistory_${shop}`;

  useEffect(() => {
    loadSalesHistory();
  }, [shop]);

  useEffect(() => {
    filterAndSummarize();
  }, [salesHistory, reportType]);

  const loadSalesHistory = () => {
    const stored = localStorage.getItem(SALES_HISTORY_KEY);
    const history = stored ? JSON.parse(stored) : [];
    setSalesHistory(history);
  };

  const filterAndSummarize = () => {
    const now = new Date();
    let startDate;

    switch (reportType) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const day = now.getDay();
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - day
        );
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date();
    }

    const filtered = salesHistory.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= startDate && sale.reason === 'Sold';
    });

    let unitsSold = 0;
    let revenue = 0;
    let cost = 0;

    filtered.forEach(sale => {
      unitsSold += sale.quantity;
      revenue += sale.quantity * sale.sellingPrice;
      cost += sale.quantity * sale.costPrice;
    });

    const profit = revenue - cost;

    setSummary({ unitsSold, revenue, cost, profit });
    setFilteredData(
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    );
  };

  return (
    <div className="sales-report">
      <h2>📊 Sales Report</h2>

      <div className="report-filters">
        <button
          className={`${reportType === 'today' ? 'active' : ''}`}
          onClick={() => setReportType('today')}
        >
          Today
        </button>
        <button
          className={`${reportType === 'week' ? 'active' : ''}`}
          onClick={() => setReportType('week')}
        >
          This Week
        </button>
        <button
          className={`${reportType === 'month' ? 'active' : ''}`}
          onClick={() => setReportType('month')}
        >
          This Month
        </button>
        <button
          className={`${reportType === 'all' ? 'active' : ''}`}
          onClick={() => setReportType('all')}
        >
          All Time
        </button>
      </div>

      <div className="report-summary">
        <div className="report-stat">
          <h4>Units Sold</h4>
          <div className="value">{summary.unitsSold}</div>
        </div>
        <div className="report-stat">
          <h4>Revenue</h4>
          <div className="value">₦{summary.revenue.toFixed(2)}</div>
        </div>
        <div className="report-stat">
          <h4>Cost</h4>
          <div className="value">₦{summary.cost.toFixed(2)}</div>
        </div>
        <div className="report-stat">
          <h4>Profit</h4>
          <div className="value">₦{summary.profit.toFixed(2)}</div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="no-data">No sales data for this period</div>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Material</th>
              <th>Color</th>
              <th>Qty</th>
              <th>Cost Price</th>
              <th>Sell Price</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Profit</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(sale => {
              const revenue = sale.quantity * sale.sellingPrice;
              const cost = sale.quantity * sale.costPrice;
              const profit = revenue - cost;

              return (
                <tr key={sale.id}>
                  <td>{new Date(sale.timestamp).toLocaleDateString()}</td>
                  <td>{sale.materialName}</td>
                  <td>{sale.color}</td>
                  <td>{sale.quantity}</td>
                  <td>₦{sale.costPrice.toFixed(2)}</td>
                  <td>₦{sale.sellingPrice.toFixed(2)}</td>
                  <td>₦{revenue.toFixed(2)}</td>
                  <td>₦{cost.toFixed(2)}</td>
                  <td style={{ fontWeight: 'bold', color: '#27ae60' }}>
                    ₦{profit.toFixed(2)}
                  </td>
                  <td>{sale.reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SalesReport;