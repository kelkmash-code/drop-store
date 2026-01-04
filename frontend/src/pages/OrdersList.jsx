import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MoreVertical, ExternalLink, User, Edit2, Play } from 'lucide-react';
import OrderModal from '../components/OrderModal';
import Header from '../components/Header';

const OrdersList = ({ filter }) => {
    const { API_URL, user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [typeFilter, setTypeFilter] = useState('All');
    const [workerFilter, setWorkerFilter] = useState('All');
    const [workers, setWorkers] = useState([]);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchWorkers();
        }
    }, [user]);

    const fetchWorkers = async () => {
        try {
            const res = await axios.get(`${API_URL}/users`);
            setWorkers(res.data.filter(u => u.role === 'worker' || u.role === 'admin'));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/orders`);
            let data = res.data;
            if (filter === 'working') data = data.filter(o => o.status === 'Working');
            if (filter === 'completed') data = data.filter(o => o.status === 'Completed');
            setOrders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const handleClaim = async (orderId) => {
        if (!window.confirm('Are you sure you want to start this order?')) return;
        try {
            await axios.post(`${API_URL}/orders/${orderId}/claim`);
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to claim order');
        }
    };

    const handleAdd = () => {
        setSelectedOrder(null);
        setShowModal(true);
    };

    const getStatusColor = (status) => {
        const colors = {
            'New': 'status-new',
            'Working': 'status-working',
            'Postponed': 'status-postponed',
            'Completed': 'status-completed'
        };
        return colors[status] || '';
    };

    const getTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'leveling': return '⚔️';
            case 'fruit': return '🍎';
            case 'item': return '📦';
            default: return '📜';
        }
    };

    const filteredOrders = orders.filter(order => {
        if (typeFilter !== 'All' && order.order_type !== typeFilter) return false;
        if (workerFilter !== 'All' && String(order.assigned_worker_id) !== String(workerFilter)) return false;
        return true;
    });

    return (
        <>
            <Header onAddOrder={handleAdd} />

            <div className="filter-bar">
                {['All', 'Leveling', 'Item', 'Fruit'].map(type => (
                    <button
                        key={type}
                        className={`filter-btn ${typeFilter === type ? 'active' : ''}`}
                        onClick={() => setTypeFilter(type)}
                    >
                        {type}
                    </button>
                ))}

                {user?.role === 'admin' && (
                    <div className="worker-filter-container">
                        <select
                            className="worker-filter-select"
                            value={workerFilter}
                            onChange={(e) => setWorkerFilter(e.target.value)}
                        >
                            <option value="All">All Workers</option>
                            {workers.map(w => (
                                <option key={w.id} value={w.id}>{w.username}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="orders-container glass-card">
                {loading ? (
                    <div className="loading-state">Loading orders...</div>
                ) : (
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Type</th>
                                <th>Client</th>
                                <th>Status</th>
                                <th>Worker</th>
                                {user?.role === 'admin' && <th>Price</th>}
                                <th>Added</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                        No orders found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} onClick={() => handleEdit(order)}>
                                        <td><span className="order-id">{order.id}</span></td>
                                        <td>
                                            <div className={`type-badge ${order.order_type?.toLowerCase()}`}>
                                                <span className="type-icon">{getTypeIcon(order.order_type)}</span>
                                                {order.order_type}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="client-info">
                                                <p>{order.client_username}</p>
                                                <span className="platform-tag">{order.platform}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="worker-pill">
                                                <User size={14} />
                                                <span>{order.worker_name || 'Unassigned'}</span>
                                            </div>
                                        </td>
                                        {user?.role === 'admin' && (
                                            <td className="price-cell">${order.accepted_price.toFixed(2)}</td>
                                        )}
                                        <td className="date-cell">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="actions-cell">
                                                {user.role === 'admin' ? (
                                                    <button className="btn-icon" title="Edit Order">
                                                        <Edit2 size={16} />
                                                    </button>
                                                ) : (
                                                    !order.assigned_worker_id && (
                                                        <button
                                                            className="btn-primary-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleClaim(order.id);
                                                            }}
                                                        >
                                                            <Play size={12} style={{ marginRight: '4px' }} />
                                                            Start
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <OrderModal
                    order={selectedOrder}
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchOrders}
                />
            )}
        </>
    );
};

export default OrdersList;
