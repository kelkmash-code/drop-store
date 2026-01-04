import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { X, ShoppingCart } from 'lucide-react';

const FruitOrderModal = ({ fruits, onClose, onSuccess }) => {
    const { API_URL } = useAuth();
    const [selectedFruit, setSelectedFruit] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [localOrderId, setLocalOrderId] = useState('');
    const [localOrders, setLocalOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLocalOrders();
    }, []);

    const fetchLocalOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/orders`);
            // Only suggest active orders
            setLocalOrders(res.data.filter(o => o.status !== 'Completed'));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFruit || !quantity || !localOrderId) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/blox-fruits/order`, {
                local_order_id: localOrderId,
                fruit_id: selectedFruit,
                quantity: parseInt(quantity)
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create fruit order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="glass-card modal-content" style={{ maxWidth: '450px', width: '100%' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShoppingCart className="text-primary" size={20} />
                        <h3>Create Fruit Order</h3>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {error && <div className="error-badge">{error}</div>}

                    <div className="form-group">
                        <label>Associate with Local Order</label>
                        <select
                            value={localOrderId}
                            onChange={(e) => setLocalOrderId(e.target.value)}
                            className="table-select"
                            style={{ width: '100%', padding: '0.75rem' }}
                            required
                        >
                            <option value="">Select an active order</option>
                            {localOrders.map(o => (
                                <option key={o.id} value={o.id}>{o.id} - {o.client_username}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Select Fruit from Stock</label>
                        <select
                            value={selectedFruit}
                            onChange={(e) => setSelectedFruit(e.target.value)}
                            className="table-select"
                            style={{ width: '100%', padding: '0.75rem' }}
                            required
                        >
                            <option value="">Select a fruit</option>
                            {fruits.map(f => (
                                <option key={f.id} value={f.id}>{f.name} (In Stock: {f.quantity})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Quantity</label>
                        <input
                            type="number"
                            min="1"
                            max={fruits.find(f => f.id == selectedFruit)?.quantity || 1}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />
                    </div>

                    <div className="modal-footer" style={{ padding: '0' }}>
                        <button type="button" className="btn-secondary" onClick={onClose} style={{ width: 'auto' }}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto' }}>
                            {loading ? 'Processing...' : 'Add to Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FruitOrderModal;
