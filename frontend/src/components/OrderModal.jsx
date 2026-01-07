import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { X, Save, History as HistoryIcon } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

const OrderModalContent = ({ order, onClose, onSuccess }) => {

    const { API_URL, user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [formData, setFormData] = useState({
        platform: 'Eldorado',
        aldorado_account: '', // New field
        client_username: '',
        client_password: '',
        client_email: '',
        order_type: 'Leveling',
        order_link: '',
        accepted_price: '',
        assigned_worker_id: '',
        status: 'New',
        notes: ''
    });

    const [workers, setWorkers] = useState([]);
    const [accounts, setAccounts] = useState([]); // Store suggested accounts
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('details');

    const [fruits, setFruits] = useState([]);
    const [selectedFruit, setSelectedFruit] = useState(null);
    const [editMode, setEditMode] = useState(!order); // Default to edit mode if creating new order
    const [screenshot, setScreenshot] = useState(null); // Ensure state exists if used
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);

    // ...

    // Removed the "return null" line that was causing the blank page.
    // Logic: If !order, we are creating, so we render.

    // Also, handleSave needed onOrderUpdated prop check
    // Ensure onOrderUpdated is passed or optional
    const safeOnOrderUpdated = onSuccess || (() => { });

    // ... handleSave uses onOrderUpdated() but it might be undefined in props
    // Actually, let's just fix the crash first.

    useEffect(() => {
        if (order) {
            setFormData({
                ...order,
                assigned_worker_id: order.assigned_worker_id || '',
                aldorado_account: order.aldorado_account || ''
            });
            // fetchHistory() removed as it is handled by fetchDeepInfo
        } else if (!isAdmin) {
            // If new order and IS WORKER, auto-assign to self and set status to Working
            setFormData(prev => ({
                ...prev,
                assigned_worker_id: user.id,
                status: 'Working'
            }));
        }

        if (isAdmin) {
            fetchWorkers();
        }
        // Always fetch accounts (backend handles visibility)
        fetchAccounts();

        // Fetch fruits if needed or pre-load
        fetchFruits();
    }, [order, user]);

    const fetchAccounts = async () => {
        try {
            const res = await axios.get(`${API_URL}/accounts`);
            setAccounts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchWorkers = async () => {
        try {
            const res = await axios.get(`${API_URL}/users`);
            setWorkers(res.data.filter(u => u.role === 'worker' || u.role === 'admin'));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchFruits = async () => {
        try {
            const res = await axios.get(`${API_URL}/blox-fruits`);
            setFruits(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Original fetchHistory is now part of fetchDeepInfo useEffect
    // const fetchHistory = async () => {
    //     try {
    //         const res = await axios.get(`${API_URL}/orders/${order.id}/history`);
    //         setHistory(res.data);
    //     } catch (err) {
    //         console.error(err);
    //     }
    // };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e?.preventDefault(); // Prevent default form submission if called from form
        try {
            let orderId = order?.id;

            if (order) {
                await axios.put(`${API_URL}/orders/${order.id}`, formData);
            } else {
                const res = await axios.post(`${API_URL}/orders`, formData);
                orderId = res.data.id;
            }

            // 2. If Order Type is Fruit AND we selected a fruit, create the link/deduct stock
            if (!order && formData.order_type === 'Fruit' && selectedFruit) {
                await axios.post(`${API_URL}/blox-fruits/order`, {
                    local_order_id: orderId,
                    fruit_id: selectedFruit.id,
                    quantity: 1 // Default to 1 for now
                });
            }

            setEditMode(false);
            if (onSuccess) onSuccess();
            if (!order) onClose();
        } catch (err) {
            alert(err.response?.data?.error || 'Save failed');
        }
    };

    const handleCompleteFlow = async () => {
        if (!screenshot) return alert("Please select a screenshot first!");

        const data = new FormData();
        data.append('screenshot', screenshot);

        setUploading(true);
        try {
            await axios.post(`${API_URL}/orders/${order.id}/complete`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowUpload(false);
            setScreenshot(null);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        if (newStatus === 'Completed') {
            setShowUpload(true);
        } else {
            setFormData(prev => ({ ...prev, status: newStatus }));
        }
    };

    if (!order && !editMode) return null; // If no order and not creating a new one, don't render

    const isAssignedToMe = user?.role === 'worker' && order?.assigned_worker_id === user?.id;
    const canEdit = isAdmin || isAssignedToMe || !order; // Can edit if admin, assigned, or creating new order

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card large-modal">
                <div className="modal-header">
                    <div className="flex flex-col">
                        <h2>{order ? `Edit Order ${order.id}` : 'Create New Order'}</h2>
                        {order && <span className="text-xs text-muted">{order.platform}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                        {order && order.status !== 'Completed' && canEdit && (
                            <button
                                onClick={() => editMode ? handleSave() : setEditMode(true)}
                                className="btn-primary"
                            >
                                {editMode ? <Save size={18} /> : <Edit2 size={18} />}
                                {editMode ? 'Save Changes' : 'Edit Order'}
                            </button>
                        )}
                        <button onClick={onClose} className="btn-icon">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`tab ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </button>
                    {order && (
                        <button
                            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            <HistoryIcon size={14} style={{ marginRight: '6px' }} />
                            History
                        </button>
                    )}
                </div>

                <form onSubmit={handleSave} className="modal-body scrollable">
                    {activeTab === 'details' ? (
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Platform</label>
                                <input
                                    type="text"
                                    disabled={!isAdmin && !!order} // Editing existing restricted to admin, creating allowed
                                    value={formData.platform}
                                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Aldorado Account</label>
                                <input
                                    type="text"
                                    list="accounts-list"
                                    disabled={!isAdmin && !!order}
                                    value={formData.aldorado_account}
                                    onChange={(e) => setFormData({ ...formData, aldorado_account: e.target.value })}
                                    placeholder="Which account took the order?"
                                />
                                <datalist id="accounts-list">
                                    {(accounts || []).map((acc, i) => (
                                        <option key={i} value={acc.name} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="form-group">
                                <label>Client Username</label>
                                <input
                                    type="text"
                                    disabled={!isAdmin && !!order}
                                    value={formData.client_username}
                                    onChange={(e) => setFormData({ ...formData, client_username: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Accepted Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    disabled={!isAdmin && !!order}
                                    value={formData.accepted_price}
                                    onChange={(e) => setFormData({ ...formData, accepted_price: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="New">New</option>
                                    <option value="Working">Working</option>
                                    <option value="Postponed">Postponed</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Order Type</label>
                                <select
                                    value={formData.order_type || 'Leveling'}
                                    onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}
                                    disabled={!isAdmin && !!order}
                                >
                                    <option value="Leveling">Leveling</option>
                                    <option value="Fruit">Fruit</option>
                                    <option value="Item">Item</option>
                                </select>
                            </div>

                            {/* Fruit Selector: Only show if creating new order, type is Fruit */}
                            {formData.order_type === 'Fruit' && !order && (
                                <div className="form-group full-width">
                                    <label>Select Available Fruit</label>
                                    <div className="fruit-selection-grid">
                                        {(fruits || []).filter(f => f.quantity > 0).length === 0 ? (
                                            <p className="text-muted" style={{ padding: '1rem', textAlign: 'center', gridColumn: '1/-1' }}>
                                                No fruits currently in stock. Please add stock in the Blox Fruits page.
                                            </p>
                                        ) : (
                                            (fruits || [])
                                                .filter(fruit => fruit.quantity > 0)
                                                .map(fruit => (
                                                    <div
                                                        key={fruit.id}
                                                        className={`fruit-option ${selectedFruit?.id === fruit.id ? 'selected' : ''}`}
                                                        onClick={() => setSelectedFruit(fruit)}
                                                    >
                                                        <div className="fruit-option-stock">{fruit.quantity}</div>
                                                        {fruit.image_url ? (
                                                            <img src={fruit.image_url} alt={fruit.name} />
                                                        ) : <div className="fruit-placeholder"></div>}
                                                        <span className="fruit-option-name">{fruit.name}</span>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                    {selectedFruit && (
                                        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#4ade80' }}>
                                            Selected: <strong>{selectedFruit.name}</strong> (Will deduct 1 from stock)
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="form-group">
                                <label>Client Password (Optional)</label>
                                <input
                                    type="text"
                                    disabled={!isAdmin && !!order}
                                    value={formData.client_password || ''}
                                    onChange={(e) => setFormData({ ...formData, client_password: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="form-group">
                                <label>Client Email</label>
                                <input
                                    type="email"
                                    disabled={!isAdmin && !!order}
                                    value={formData.client_email || ''}
                                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Order Link</label>
                                <input
                                    type="url"
                                    disabled={!isAdmin && !!order}
                                    value={formData.order_link || ''}
                                    onChange={(e) => setFormData({ ...formData, order_link: e.target.value })}
                                />
                            </div>

                            {isAdmin && (
                                <div className="form-group">
                                    <div className="form-group full-width">
                                        <label>Assign Worker</label>
                                        <div className="worker-selection-grid">
                                            <div
                                                className={`worker-option ${!formData.assigned_worker_id ? 'selected unassigned' : ''}`}
                                                onClick={() => setFormData({ ...formData, assigned_worker_id: '' })}
                                            >
                                                <div className="worker-avatar">?</div>
                                                <div className="worker-info">
                                                    <span className="worker-name">Unassigned</span>
                                                </div>
                                            </div>
                                            {(workers || []).map(w => (
                                                <div
                                                    key={w.id}
                                                    className={`worker-option ${formData.assigned_worker_id === w.id ? 'selected' : ''}`}
                                                    onClick={() => setFormData({ ...formData, assigned_worker_id: w.id })}
                                                >
                                                    <div className="worker-avatar">
                                                        {(w.username || 'User').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="worker-name">{w.username}</span>
                                                    <span className="worker-role">{w.role}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-group full-width">
                                <label>Notes / Instructions</label>
                                <textarea
                                    className="full-width-textarea"
                                    rows="3"
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            {order && order.screenshot_path && (
                                <div className="form-group full-width">
                                    <label>Proof of Work</label>
                                    <div className="mt-2 glass-card p-2 inline-block">
                                        <a href={`${API_URL}/uploads/${order.screenshot_path}`} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={`${API_URL}/uploads/${order.screenshot_path}`}
                                                alt="Proof"
                                                className="rounded-lg max-h-48 object-cover hover:opacity-90 transition-opacity"
                                            />
                                        </a>
                                        <p className="text-xs text-center mt-1 text-muted">Click to enlarge</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="history-list">
                            {(history || []).map((h, i) => (
                                <div key={i} className="history-item">
                                    <div className="history-dot"></div>
                                    <div className="history-content">
                                        <p>
                                            Status changed from <strong>{h.status_from || 'None'}</strong> to <strong>{h.status_to}</strong>
                                        </p>
                                        <span className="history-meta">
                                            by {h.changed_by_name} • {new Date(h.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </form>

                <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                    {order && isAdmin ? (
                        <button type="button" onClick={async () => {
                            if (confirm('Are you sure you want to delete this order? This cannot be undone.')) {
                                try {
                                    await axios.delete(`${API_URL}/orders/${order.id}`);
                                    if (onSuccess) onSuccess();
                                    onClose();
                                } catch (err) {
                                    alert('Failed to delete order');
                                }
                            }
                        }} className="btn-secondary" style={{ color: '#ef4444', borderColor: '#ef444433' }}>
                            Delete
                        </button>
                    ) : <div></div>}

                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="button" onClick={handleSave} className="btn-primary">
                            <Save size={18} style={{ marginRight: '6px' }} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
            {/* Upload Modal Overlay */}
            {showUpload && (
                <div className="modal-overlay" style={{ zIndex: 60 }}>
                    <div className="modal-content glass-card p-6" style={{ maxWidth: '400px' }}>
                        <h3 className="mb-4">Upload Proof of Work</h3>
                        <p className="text-muted text-sm mb-4">You must upload a screenshot to mark this order as Completed.</p>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setScreenshot(e.target.files[0])}
                            className="form-input mb-4"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowUpload(false); setScreenshot(null); }}
                                className="btn-secondary"
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCompleteFlow}
                                className="btn-primary"
                                disabled={!screenshot || uploading}
                            >
                                {uploading ? 'Uploading...' : 'Complete Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const OrderModal = (props) => (
    <ErrorBoundary>
        <OrderModalContent {...props} />
    </ErrorBoundary>
);

export default OrderModal;
