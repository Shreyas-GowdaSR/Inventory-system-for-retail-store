import React, { useState, useEffect } from 'react';
import {
  Store,
  Package,
  AlertTriangle,
  AlertCircle,
  Plus,
  Minus,
  Search,
  RefreshCw,
  Database,
  Shield,
  User,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Edit2,
  Trash2,
  HelpCircle,
  Copy,
  X,
  TrendingUp,
  History,
  ShoppingCart,
  LogIn,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function App() {
  // Inventory and System States
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'out', 'in'

  // User Authentication State (Default: Admin for smooth testing)
  const [currentUser, setCurrentUser] = useState({
    id: 'user-admin-1',
    name: 'Ramesh (Store Owner)',
    email: 'admin@store.com',
    role: 'admin' // 'admin' or 'staff'
  });

  // Modal Dialogs
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stockModalData, setStockModalData] = useState(null); // { item, type: 'IN' | 'OUT' }
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Forms
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Grains & Staples',
    quantity: 10,
    unit: 'kg',
    cost_price: 30,
    selling_price: 40,
    min_stock_level: 5
  });

  const [txForm, setTxForm] = useState({
    quantity_change: 1,
    notes: '',
    change_type: 'OUT'
  });

  const [supabaseForm, setSupabaseForm] = useState({
    url: '',
    secretKey: '',
    publishableKey: '',
    key: ''
  });

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    role: 'admin',
    name: ''
  });

  const [copiedSql, setCopiedSql] = useState(false);
  const [toast, setToast] = useState(null);
  const [sqlSchema, setSqlSchema] = useState('');

  const CATEGORIES = [
    'All',
    'Grains & Staples',
    'Pulses & Lentils',
    'Sugar & Salt',
    'Oils & Ghee',
    'Tea & Coffee',
    'Dairy & Bakery',
    'Household & Cleaning',
    'Snacks & Packaged'
  ];

  const UNITS = ['kg', 'L', 'pkt', 'pcs', 'g', 'ml'];

  // Trigger brief toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // Fetch Inventory items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error('Failed to load items');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
      showToast('Could not fetch items from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch status & alerts
  const fetchStatusAndAlerts = async () => {
    try {
      const [statusRes, alertsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/alerts')
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setSystemStatus(sData);
        if (sData.supabase?.fullUrl) {
          setSupabaseForm(prev => ({
            ...prev,
            url: sData.supabase.fullUrl
          }));
        }
      }

      if (alertsRes.ok) {
        const aData = await alertsRes.json();
        setAlerts(aData.alerts || []);
      }
    } catch (err) {
      console.error('Status fetch error:', err);
    }
  };

  // Fetch stock logs
  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/stock-transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Transactions fetch error:', err);
    }
  };

  // Fetch SQL Schema guide
  const fetchSqlSchema = async () => {
    try {
      const res = await fetch('/api/sql-schema');
      if (res.ok) {
        const data = await res.json();
        setSqlSchema(data.sql);
      }
    } catch (e) {
      console.error('SQL schema fetch error:', e);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchStatusAndAlerts();
    fetchTransactions();
    fetchSqlSchema();
  }, []);

  // Quick inline stock increment / decrement
  const handleQuickAdjust = async (item, delta, type = null) => {
    const changeType = type || (delta > 0 ? 'IN' : 'OUT');
    const absChange = Math.abs(delta);

    if (changeType === 'OUT' && Number(item.quantity) < absChange) {
      showToast(`Cannot sell ${absChange} ${item.unit}. Only ${item.quantity} ${item.unit} available!`, 'error');
      return;
    }

    try {
      const res = await fetch('/api/stock-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          change_type: changeType,
          quantity_change: absChange,
          notes: changeType === 'OUT' ? 'Quick counter sale' : 'Quick restock',
          performed_by: `${currentUser.name} (${currentUser.role})`
        })
      });

      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Failed to update stock', 'error');
        return;
      }

      showToast(
        `${item.name}: stock is now ${result.item.quantity} ${result.item.unit}`,
        result.isLowStock ? 'alert' : 'success'
      );

      // Refresh items and alerts
      fetchItems();
      fetchStatusAndAlerts();
      fetchTransactions();
    } catch (err) {
      console.error(err);
      showToast('Network error updating stock', 'error');
    }
  };

  // Open transaction modal
  const openStockModal = (item, type = 'OUT') => {
    setStockModalData({ item, type });
    setTxForm({
      quantity_change: type === 'OUT' ? 1 : 10,
      notes: '',
      change_type: type
    });
  };

  // Submit transaction from modal
  const handleStockTxSubmit = async (e) => {
    e.preventDefault();
    if (!stockModalData) return;

    const item = stockModalData.item;
    const qty = Number(txForm.quantity_change);

    if (!qty || qty <= 0) {
      showToast('Please enter a valid quantity greater than 0', 'error');
      return;
    }

    if (txForm.change_type === 'OUT' && Number(item.quantity) < qty) {
      showToast(`Insufficient stock! Store only has ${item.quantity} ${item.unit} of ${item.name}`, 'error');
      return;
    }

    try {
      const res = await fetch('/api/stock-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          change_type: txForm.change_type,
          quantity_change: qty,
          notes: txForm.notes || (txForm.change_type === 'OUT' ? 'Counter sale' : 'Inventory delivery'),
          performed_by: `${currentUser.name} (${currentUser.role})`
        })
      });

      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Failed to record transaction', 'error');
        return;
      }

      showToast(
        `${txForm.change_type === 'OUT' ? 'Sold' : 'Restocked'} ${qty} ${item.unit} of ${item.name}!`,
        result.isLowStock ? 'alert' : 'success'
      );

      setStockModalData(null);
      fetchItems();
      fetchStatusAndAlerts();
      fetchTransactions();
    } catch (err) {
      console.error(err);
      showToast('Error recording stock movement', 'error');
    }
  };

  // Open Create/Edit Item Modal
  const openItemModal = (item = null) => {
    if (currentUser.role !== 'admin') {
      showToast('Only Store Admin can add or edit store items.', 'error');
      return;
    }

    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        cost_price: item.cost_price,
        selling_price: item.selling_price,
        min_stock_level: item.min_stock_level
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        category: 'Grains & Staples',
        quantity: 10,
        unit: 'kg',
        cost_price: 30,
        selling_price: 40,
        min_stock_level: 5
      });
    }
    setShowItemModal(true);
  };

  // Submit Item Create or Edit
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      showToast('Please enter item name', 'error');
      return;
    }

    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemForm,
          role: currentUser.role
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to save item', 'error');
        return;
      }

      showToast(editingItem ? 'Item updated successfully!' : 'New item added to store catalog!');
      setShowItemModal(false);
      setEditingItem(null);
      fetchItems();
      fetchStatusAndAlerts();
      fetchTransactions();
    } catch (err) {
      console.error(err);
      showToast('Server error saving item', 'error');
    }
  };

  // Delete Item (Admin only)
  const handleDeleteItem = async (item) => {
    if (currentUser.role !== 'admin') {
      showToast('Only Store Admin can delete items.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove "${item.name}" from store inventory?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error || 'Failed to delete item', 'error');
        return;
      }

      showToast(`Removed "${item.name}" from inventory.`);
      fetchItems();
      fetchStatusAndAlerts();
      fetchTransactions();
    } catch (err) {
      console.error(err);
      showToast('Error deleting item', 'error');
    }
  };

  // Save / Test Supabase credentials (supports secret key or publishable key)
  const handleSaveSupabase = async (e) => {
    e.preventDefault();
    const activeKey = supabaseForm.secretKey || supabaseForm.publishableKey || supabaseForm.key;
    if (!supabaseForm.url || !activeKey) {
      showToast('Please provide your Supabase Project URL and either a Secret Key or Publishable Key', 'error');
      return;
    }

    try {
      const res = await fetch('/api/config/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: supabaseForm.url,
          secretKey: supabaseForm.secretKey,
          publishableKey: supabaseForm.publishableKey,
          key: activeKey
        })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to connect to Supabase', 'error');
        return;
      }

      showToast('Supabase PostgreSQL configuration updated successfully!');
      fetchStatusAndAlerts();
      fetchItems();
    } catch (err) {
      console.error(err);
      showToast('Failed to reach server to update Supabase', 'error');
    }
  };

  // Reset to local mode
  const handleResetSupabase = async () => {
    try {
      const res = await fetch('/api/config/supabase/reset', { method: 'POST' });
      if (res.ok) {
        showToast('Switched to local provision store mode');
        setSupabaseForm({ url: '', secretKey: '', publishableKey: '', key: '' });
        fetchStatusAndAlerts();
        fetchItems();
      }
    } catch (e) {
      showToast('Error resetting database mode', 'error');
    }
  };

  // Switch demo roles
  const handleRoleSwitch = (role) => {
    if (role === 'admin') {
      setCurrentUser({
        id: 'user-admin-1',
        name: 'Ramesh Sharma (Owner)',
        email: 'admin@store.com',
        role: 'admin'
      });
      showToast('Switched to Store Admin role (Full permissions)');
    } else {
      setCurrentUser({
        id: 'user-staff-1',
        name: 'Suresh Kumar (Counter Staff)',
        email: 'staff@store.com',
        role: 'staff'
      });
      showToast('Switched to Staff role (Sales & Stock entry only)');
    }
    setShowAuthModal(false);
  };

  // Copy SQL script to clipboard
  const handleCopySql = () => {
    if (!sqlSchema) return;
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    showToast('Supabase SQL Schema copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Filtered Items logic
  const filteredItems = items.filter(item => {
    // Search filter
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;

    // Stock alert filter
    const isLow = Number(item.quantity) <= Number(item.min_stock_level);
    const isOut = Number(item.quantity) <= 0;

    let matchesStock = true;
    if (stockFilter === 'low') matchesStock = isLow;
    else if (stockFilter === 'out') matchesStock = isOut;
    else if (stockFilter === 'in') matchesStock = !isLow && !isOut;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Calculate Metrics
  const totalItemsCount = items.length;
  const lowStockCount = items.filter(i => Number(i.quantity) <= Number(i.min_stock_level) && Number(i.quantity) > 0).length;
  const outOfStockCount = items.filter(i => Number(i.quantity) <= 0).length;
  const totalStockUnits = items.reduce((sum, i) => sum + Number(i.quantity), 0);
  const totalInventoryValuation = items.reduce((sum, i) => sum + (Number(i.cost_price || 0) * Number(i.quantity || 0)), 0);

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="brand-section">
          <div className="brand-icon-box">
            <Store size={24} />
          </div>
          <div>
            <h1 className="brand-title">KiranaStore Inventory</h1>
            <p className="brand-subtitle">Small Provision Store Stock Tracking & Low-Level Alerts</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Supabase PostgreSQL Status Indicator */}
          <div
            className={`db-status-badge ${systemStatus?.supabase?.connected && systemStatus?.supabase?.tablesExist ? 'live' : 'local'}`}
            onClick={() => setShowSupabaseModal(true)}
            title="Click to view Supabase PostgreSQL connection & SQL guide"
          >
            <span className={`status-dot ${systemStatus?.supabase?.connected && systemStatus?.supabase?.tablesExist ? 'green' : 'amber'}`}></span>
            <span>
              {systemStatus?.supabase?.connected && systemStatus?.supabase?.tablesExist
                ? 'Supabase PostgreSQL'
                : 'Local Mode (Supabase Ready)'}
            </span>
          </div>

          {/* User Role Indicator & Switcher */}
          <div
            className="user-profile-badge"
            onClick={() => setShowAuthModal(true)}
            title="Click to switch between Admin and Staff"
          >
            <span className={`role-pill ${currentUser.role}`}>
              {currentUser.role}
            </span>
            <span className="user-name-text">{currentUser.name}</span>
            <User size={14} color="#64748b" />
          </div>
        </div>
      </header>

      {/* Low Stock Alerts Notification Banner */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="alerts-banner">
          <div className="alerts-banner-content">
            <AlertTriangle size={18} />
            <span>
              {outOfStockCount > 0 && `${outOfStockCount} item(s) are completely OUT OF STOCK! `}
              {lowStockCount > 0 && `${lowStockCount} item(s) are below minimum reorder level.`}
            </span>
          </div>
          <button
            className="alerts-banner-btn"
            onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          >
            {stockFilter === 'low' ? 'Show All Items' : 'Filter Low Stock Items'}
          </button>
        </div>
      )}

      {/* Main Body */}
      <main className="main-wrapper">
        {/* Top Summary Metrics */}
        <section className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Total Store Items</span>
            <span className="metric-value">{totalItemsCount}</span>
            <span className="metric-sub">{totalStockUnits.toFixed(0)} total units across items</span>
          </div>

          <div className={`metric-card ${lowStockCount > 0 ? 'alert-card' : ''}`}>
            <span className="metric-label">Low Stock Alerts</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="metric-value" style={{ color: lowStockCount > 0 ? 'var(--warning)' : 'inherit' }}>
                {lowStockCount}
              </span>
              {lowStockCount > 0 && <AlertTriangle size={20} color="var(--warning)" />}
            </div>
            <span className="metric-sub">Need distributor restock soon</span>
          </div>

          <div className={`metric-card ${outOfStockCount > 0 ? 'danger-card' : ''}`}>
            <span className="metric-label">Out of Stock</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="metric-value" style={{ color: outOfStockCount > 0 ? 'var(--danger)' : 'inherit' }}>
                {outOfStockCount}
              </span>
              {outOfStockCount > 0 && <AlertCircle size={20} color="var(--danger)" />}
            </div>
            <span className="metric-sub">Zero quantity remaining</span>
          </div>

          <div className="metric-card success-card">
            <span className="metric-label">Inventory Valuation</span>
            <span className="metric-value">
              {currentUser.role === 'admin' ? `₹${totalInventoryValuation.toLocaleString()}` : 'Protected'}
            </span>
            <span className="metric-sub">
              {currentUser.role === 'admin' ? 'Total wholesale cost' : 'Visible to Admin only'}
            </span>
          </div>
        </section>

        {/* Action & Filter Control Bar */}
        <section className="action-bar">
          <div className="action-bar-top">
            {/* Search Input */}
            <div className="search-box">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                className="search-input"
                placeholder="Search provision item (e.g. rice, atta, oil, sugar)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Dropdown */}
            <select
              className="category-select"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>

            {/* Action Buttons */}
            <div className="action-buttons-group">
              {currentUser.role === 'admin' && (
                <button className="btn btn-primary" onClick={() => openItemModal()}>
                  <Plus size={16} /> Add Item
                </button>
              )}

              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(true)}>
                <History size={16} /> Stock Logs
              </button>

              <button className="btn btn-secondary" onClick={() => setShowSupabaseModal(true)}>
                <Database size={16} /> Supabase PostgreSQL
              </button>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="filter-pills-row">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>
              Quick Filters:
            </span>
            <button
              className={`filter-pill ${stockFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStockFilter('all')}
            >
              All Items ({items.length})
            </button>
            <button
              className={`filter-pill alert-pill ${stockFilter === 'low' ? 'active' : ''}`}
              onClick={() => setStockFilter('low')}
            >
              ⚠️ Low Stock Alerts ({lowStockCount})
            </button>
            <button
              className={`filter-pill danger-pill ${stockFilter === 'out' ? 'active' : ''}`}
              onClick={() => setStockFilter('out')}
            >
              ❌ Out of Stock ({outOfStockCount})
            </button>
            <button
              className={`filter-pill ${stockFilter === 'in' ? 'active' : ''}`}
              onClick={() => setStockFilter('in')}
            >
              Healthy Stock ({items.length - lowStockCount - outOfStockCount})
            </button>
          </div>
        </section>

        {/* Inventory Table */}
        <section className="table-card">
          <div className="table-header-bar">
            <div>
              <span className="table-header-title">Store Provision Stock</span>
              <span className="table-header-count"> • Showing {filteredItems.length} items</span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { fetchItems(); fetchStatusAndAlerts(); }}
              title="Refresh stock data"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          <div className="table-responsive">
            {loading ? (
              <div className="empty-state">
                <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p>Loading provision items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state">
                <Package className="empty-state-icon" />
                <h3>No provision items found</h3>
                <p>Try clearing your search query or adjusting your filters.</p>
                {currentUser.role === 'admin' && (
                  <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => openItemModal()}>
                    <Plus size={16} /> Add First Item
                  </button>
                )}
              </div>
            ) : (
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Item & Category</th>
                    <th>Current Stock</th>
                    <th>Alert Level</th>
                    {currentUser.role === 'admin' && <th>Cost Price</th>}
                    <th>Selling Price</th>
                    {currentUser.role === 'admin' && <th>Margin</th>}
                    <th>Quick Counter Actions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const qty = Number(item.quantity);
                    const min = Number(item.min_stock_level);
                    const isOut = qty <= 0;
                    const isLow = qty <= min && !isOut;
                    const margin = item.selling_price > 0 && item.cost_price > 0
                      ? (((item.selling_price - item.cost_price) / item.selling_price) * 100).toFixed(0)
                      : null;

                    return (
                      <tr
                        key={item.id}
                        className={isOut ? 'row-out-stock' : isLow ? 'row-low-stock' : ''}
                      >
                        {/* Item Name & Category */}
                        <td>
                          <div className="item-name-cell">
                            <span>{item.name}</span>
                            <span className="item-category-tag">{item.category}</span>
                          </div>
                        </td>

                        {/* Stock Quantity with Badge */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              className={`stock-badge ${isOut ? 'out-stock' : isLow ? 'low-stock' : 'in-stock'}`}
                            >
                              {isOut && <AlertCircle size={14} />}
                              {isLow && <AlertTriangle size={14} />}
                              {qty} {item.unit}
                            </span>
                            {isOut && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>OUT!</span>}
                            {isLow && <span style={{ fontSize: '0.75rem', color: 'var(--warning-dark)', fontWeight: 600 }}>LOW!</span>}
                          </div>
                        </td>

                        {/* Minimum Alert Level */}
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            ≤ {min} {item.unit}
                          </span>
                        </td>

                        {/* Cost Price (Admin only) */}
                        {currentUser.role === 'admin' && (
                          <td>
                            <span className="price-tag">₹{Number(item.cost_price || 0).toFixed(0)}</span>
                          </td>
                        )}

                        {/* Selling Price */}
                        <td>
                          <span className="price-tag" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                            ₹{Number(item.selling_price || 0).toFixed(0)}
                          </span>
                        </td>

                        {/* Profit Margin (Admin only) */}
                        {currentUser.role === 'admin' && (
                          <td>
                            {margin !== null ? (
                              <span className="margin-pill">+{margin}%</span>
                            ) : (
                              <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>-</span>
                            )}
                          </td>
                        )}

                        {/* Quick Counter Adjustments */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* Sell Button */}
                            <button
                              className="adjust-btn minus"
                              title={`Sell 1 ${item.unit} (Counter Sale)`}
                              disabled={isOut}
                              onClick={() => handleQuickAdjust(item, -1, 'OUT')}
                            >
                              -1
                            </button>

                            {/* Restock Button */}
                            <button
                              className="adjust-btn plus"
                              title={`Restock +5 ${item.unit}`}
                              onClick={() => handleQuickAdjust(item, 5, 'IN')}
                            >
                              +5
                            </button>

                            {/* Custom Transaction */}
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                              onClick={() => openStockModal(item, 'OUT')}
                              title="Record custom sale or delivery"
                            >
                              More...
                            </button>
                          </div>
                        </td>

                        {/* Action buttons (Edit/Delete) */}
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {currentUser.role === 'admin' ? (
                              <>
                                <button
                                  className="btn btn-secondary btn-icon"
                                  onClick={() => openItemModal(item)}
                                  title="Edit item details"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="btn btn-secondary btn-icon"
                                  style={{ color: 'var(--danger)' }}
                                  onClick={() => handleDeleteItem(item)}
                                  title="Delete item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                Staff view
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* MODAL 1: Add or Edit Item (Admin) */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingItem ? 'Edit Provision Item' : 'Add New Provision Item'}
              </h2>
              <button className="modal-close-btn" onClick={() => setShowItemModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleItemSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Item Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Sona Masoori Rice or Aashirvaad Atta"
                    value={itemForm.name}
                    onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={itemForm.category}
                      onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit of Measurement</label>
                    <select
                      className="form-select"
                      value={itemForm.unit}
                      onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                    >
                      {UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Initial Quantity in Stock</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      className="form-input"
                      value={itemForm.quantity}
                      onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Low-Stock Alert Level <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      className="form-input"
                      value={itemForm.min_stock_level}
                      onChange={e => setItemForm({ ...itemForm, min_stock_level: e.target.value })}
                    />
                    <p className="form-help">Trigger alert when stock drops to or below this amount.</p>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Wholesale Cost Price (₹)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      value={itemForm.cost_price}
                      onChange={e => setItemForm({ ...itemForm, cost_price: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Retail Selling Price (₹)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      value={itemForm.selling_price}
                      onChange={e => setItemForm({ ...itemForm, selling_price: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowItemModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Custom Stock Transaction (IN / OUT) */}
      {stockModalData && (
        <div className="modal-overlay" onClick={() => setStockModalData(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Record Stock Movement</h2>
              <button className="modal-close-btn" onClick={() => setStockModalData(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStockTxSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{stockModalData.item.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Current Store Stock: <strong>{stockModalData.item.quantity} {stockModalData.item.unit}</strong> • Alert Threshold: {stockModalData.item.min_stock_level} {stockModalData.item.unit}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Transaction Type</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className={`btn ${txForm.change_type === 'OUT' ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                      onClick={() => setTxForm({ ...txForm, change_type: 'OUT' })}
                    >
                      <ArrowDownRight size={16} /> Customer Sale (Stock OUT)
                    </button>
                    <button
                      type="button"
                      className={`btn ${txForm.change_type === 'IN' ? 'btn-success' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                      onClick={() => setTxForm({ ...txForm, change_type: 'IN' })}
                    >
                      <ArrowUpRight size={16} /> Supplier Restock (Stock IN)
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Quantity ({stockModalData.item.unit}) <span className="req">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    className="form-input"
                    value={txForm.quantity_change}
                    onChange={e => setTxForm({ ...txForm, quantity_change: e.target.value })}
                  />

                  {/* Quick Preset Buttons */}
                  <div className="preset-buttons-row">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Presets:</span>
                    {[1, 2, 5, 10, 25].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        className="preset-btn"
                        onClick={() => setTxForm({ ...txForm, quantity_change: amt })}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Notes (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Morning counter sale, wholesale supplier delivery..."
                    value={txForm.notes}
                    onChange={e => setTxForm({ ...txForm, notes: e.target.value })}
                  />
                </div>

                {/* Stock Preview */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '10px', background: '#f1f5f9', borderRadius: '6px' }}>
                  Resulting Stock: {' '}
                  <strong>
                    {txForm.change_type === 'OUT'
                      ? Math.max(0, Number(stockModalData.item.quantity) - Number(txForm.quantity_change || 0))
                      : Number(stockModalData.item.quantity) + Number(txForm.quantity_change || 0)
                    } {stockModalData.item.unit}
                  </strong>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStockModalData(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${txForm.change_type === 'OUT' ? 'btn-danger' : 'btn-success'}`}
                >
                  Confirm {txForm.change_type === 'OUT' ? 'Sale' : 'Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Stock Log Audit Trail */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-dialog wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Stock Transaction Audit History</h2>
              <button className="modal-close-btn" onClick={() => setShowHistoryModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Complete log of inventory changes, sales, and restocks tracked by staff and admin.
              </p>

              {transactions.length === 0 ? (
                <div className="empty-state">
                  <p>No transactions recorded yet.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '380px' }}>
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Item</th>
                        <th>Type</th>
                        <th>Qty Change</th>
                        <th>New Stock</th>
                        <th>Notes</th>
                        <th>Handled By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => (
                        <tr key={tx.id || idx}>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <br />
                            {new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </td>
                          <td style={{ fontWeight: 600 }}>{tx.item_name}</td>
                          <td>
                            <span
                              className={`role-pill ${tx.change_type === 'IN' ? 'admin' : 'staff'}`}
                              style={{
                                backgroundColor: tx.change_type === 'IN' ? 'var(--primary)' : 'var(--accent)'
                              }}
                            >
                              {tx.change_type}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: tx.quantity_change > 0 ? 'var(--primary)' : 'var(--danger)' }}>
                            {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>
                            {tx.new_quantity !== undefined ? tx.new_quantity : '-'}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {tx.notes || '-'}
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>
                            {tx.performed_by}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Supabase PostgreSQL Setup & SQL Learning Guide */}
      {showSupabaseModal && (
        <div className="modal-overlay" onClick={() => setShowSupabaseModal(false)}>
          <div className="modal-dialog wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Supabase PostgreSQL Integration & Learning Guide</h2>
              <button className="modal-close-btn" onClick={() => setShowSupabaseModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Connection Status Box */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  background: systemStatus?.supabase?.connected && systemStatus?.supabase?.tablesExist ? '#ecfdf5' : '#fffbeb',
                  border: `1px solid ${systemStatus?.supabase?.connected && systemStatus?.supabase?.tablesExist ? '#a7f3d0' : '#fde68a'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: systemStatus?.supabase?.connected && systemStatus?.supabase?.tablesExist ? '#065f46' : '#92400e' }}>
                  <Database size={18} />
                  <span>
                    Status: {systemStatus?.supabase?.connected && systemStatus?.supabase?.tablesExist ? 'Connected to Supabase PostgreSQL!' : 'Local Provision Store Mode'}
                  </span>
                  {systemStatus?.supabase?.keyType && systemStatus.supabase.keyType !== 'none' && (
                    <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                      Key: {systemStatus.supabase.keyType}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.82rem', marginTop: '4px', color: '#475569' }}>
                  {systemStatus?.supabase?.message}
                </p>
              </div>

              {/* Step by step for students */}
              <div className="learning-step-card">
                <span className="step-number">1</span>
                <strong>How the Tech Stack Connects:</strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  • <strong>React:</strong> Web user interface for store counter staff & owner.<br />
                  • <strong>Node.js + Express:</strong> Backend REST API server handling store endpoints and stock transactions.<br />
                  • <strong>Supabase PostgreSQL:</strong> Relational database storing <code>items</code> and <code>stock_logs</code> tables with Row Level Security.
                </p>
                <div style={{ marginTop: '8px', padding: '8px 12px', background: '#e0f2fe', borderRadius: '6px', fontSize: '0.8rem', color: '#0369a1' }}>
                  🔑 <strong>Supabase API Keys:</strong> Supabase uses a <strong>Secret Key</strong> (for backend Node.js server operations) and a <strong>Publishable Key</strong> (for client/browser safe operations). Both are supported!
                </div>
              </div>

              <div className="learning-step-card">
                <span className="step-number">2</span>
                <strong>Supabase SQL Editor Setup:</strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Copy this SQL script and paste it into your Supabase project's <strong>SQL Editor</strong> to create the PostgreSQL tables:
                </p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }} onClick={handleCopySql}>
                  <Copy size={14} /> {copiedSql ? 'Copied!' : 'Copy SQL Schema Script'}
                </button>
                <pre className="sql-box">{sqlSchema}</pre>
              </div>

              <div className="learning-step-card">
                <span className="step-number">3</span>
                <strong>Connect Your Supabase Project:</strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 10px' }}>
                  Found in your Supabase Dashboard under <strong>Project Settings → API & Keys</strong>.
                </p>
                <form onSubmit={handleSaveSupabase} style={{ marginTop: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Supabase Project URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://yourprojectid.supabase.co"
                      value={supabaseForm.url}
                      onChange={e => setSupabaseForm({ ...supabaseForm, url: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Secret Key <span style={{ color: 'var(--primary)', fontSize: '0.78rem' }}>(Recommended for Node.js Express backend)</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="sb_sec_... or service_role key"
                      value={supabaseForm.secretKey}
                      onChange={e => setSupabaseForm({ ...supabaseForm, secretKey: e.target.value })}
                    />
                    <p className="form-help">Bypasses RLS for secure server-side stock updates and audit logs.</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Publishable Key <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>(Alternative / public key)</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="sb_pub_... or anon key"
                      value={supabaseForm.publishableKey}
                      onChange={e => setSupabaseForm({ ...supabaseForm, publishableKey: e.target.value })}
                    />
                    <p className="form-help">Standard publishable key respecting RLS policies.</p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="submit" className="btn btn-primary btn-sm">
                      Connect & Verify Tables
                    </button>
                    {systemStatus?.supabase?.configured && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleResetSupabase}
                      >
                        Reset to Local Mode
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSupabaseModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: User Role & Authentication (Admin vs Staff) */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Store Staff & Admin Access</h2>
              <button className="modal-close-btn" onClick={() => setShowAuthModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Current Active Role: <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
                </p>
              </div>

              {/* Quick Switch for Testing / Learning */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <strong style={{ fontSize: '0.9rem' }}>Quick Role Switch (Instant Demo):</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 12px' }}>
                  Test the difference between Admin and Counter Staff permissions with one click.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    className={`btn ${currentUser.role === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleRoleSwitch('admin')}
                  >
                    <Shield size={16} /> Admin (Owner)
                  </button>
                  <button
                    className={`btn ${currentUser.role === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleRoleSwitch('staff')}
                  >
                    <User size={16} /> Staff (Counter)
                  </button>
                </div>

                <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  • <strong>Admin:</strong> Add items, edit pricing, adjust low-stock thresholds, delete items, view margins.<br />
                  • <strong>Staff:</strong> View inventory, record customer sales, record distributor restocks, check low-stock alerts.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAuthModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`toast-notice ${toast.type}`}>
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.type === 'alert' && <AlertTriangle size={18} />}
          {toast.type === 'success' && <CheckCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
