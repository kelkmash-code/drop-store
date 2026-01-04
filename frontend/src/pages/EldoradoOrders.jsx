import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Download, CheckCircle, ArrowRight, Clipboard } from 'lucide-react';

const EldoradoOrderRow = ({ order, workers, handleConvert }) => {
    const [selectedWorker, setSelectedWorker] = useState('');

    return (
        <tr key={order.eldorado_id}>
            <td><span className="order-id">{order.eldorado_id}</span></td>
            <td>{order.buyer_username}</td>
            <td className="price-cell">${order.accepted_price.toFixed(2)}</td>
            <td><span className="state-badge">{order.state}</span></td>
            <td>
                <select
                    className="table-select"
                    value={selectedWorker}
                    onChange={(e) => setSelectedWorker(e.target.value)}
                >
                    <option value="">Select Worker</option>
                    {workers.map(w => (
                        <option key={w.id} value={w.id}>{w.username}</option>
                    ))}
                </select>
            </td>
            <td>
                <button
                    className="btn-convert"
                    onClick={() => handleConvert(order.eldorado_id, selectedWorker)}
                >
                    <ArrowRight size={14} />
                    <span>Convert</span>
                </button>
            </td>
        </tr>
    );
};

const EldoradoOrders = () => {
    const { API_URL } = useAuth();
    const [eldoradoOrders, setEldoradoOrders] = useState([]);
    const [rawInput, setRawInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [workers, setWorkers] = useState([]);

    useEffect(() => {
        fetchEldoradoOrders();
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        try {
            const res = await axios.get(`${API_URL}/users`);
            setWorkers(res.data.filter(u => u.role === 'worker' || u.role === 'admin'));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchEldoradoOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/orders/eldorado`);
            setEldoradoOrders(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleImport = async () => {
        try {
            // Basic parser for Eldorado raw data (comma or tab separated, or valid JSON)
            // For this demo, we'll expect a simple JSON array or let's try to parse a text block
            let ordersToImport = [];
            try {
                ordersToImport = JSON.parse(rawInput);
            } catch (e) {
                // Fallback: simple line-based parser
                const lines = rawInput.trim().split('\n');
                ordersToImport = lines.map(line => {
                    const [id, buyer, price, link] = line.split('\t');
                    return {
                        eldorado_id: id?.trim(),
                        buyer_username: buyer?.trim(),
                        accepted_price: parseFloat(price?.replace('$', '')?.trim()),
                        order_link: link?.trim()
                    };
                }).filter(o => o.eldorado_id && o.buyer_username && !isNaN(o.accepted_price));
            }

            if (ordersToImport.length === 0) {
                alert('Could not find any valid orders to import. Please use JSON or Tab-separated format.');
                return;
            }

            await axios.post(`${API_URL}/orders/eldorado/import`, { orders: ordersToImport });
            setRawInput('');
            setShowImport(false);
            fetchEldoradoOrders();
        } catch (err) {
            alert('Import failed: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleConvert = async (eldoradoId, workerId) => {
        if (!workerId) {
            alert('Please select a worker to assign first.');
            return;
        }
        try {
            await axios.post(`${API_URL}/orders/eldorado/convert/${eldoradoId}`, {
                assigned_worker_id: workerId
            });
            fetchEldoradoOrders();
        } catch (err) {
            alert('Conversion failed');
        }
    };

    return (
        <div className="eldorado-view">
            <header className="header">
                <div className="header-title">
                    <h2>Eldorado Accepted Orders</h2>
                    <p className="text-muted">Manage orders from dashboard/orders/sold</p>
                </div>
                <button className="btn-primary flex-between" onClick={() => setShowImport(!showImport)}>
                    <Clipboard size={18} />
                    <span style={{ marginLeft: '0.5rem' }}>Import Orders</span>
                </button>
            </header>

            {showImport && (
                <div className="glass-card import-box mb-2">
                    <h3>Paste Order Data</h3>
                    <p className="text-muted mb-2">Format: ID (Tab) Buyer (Tab) Price (Tab) Link - or raw JSON array</p>
                    <textarea
                        rows="5"
                        className="full-width-textarea"
                        placeholder={`ELD-123456\tJohnDoe\t25.50\thttps://eldorado.gg/...\nELD-123457\tJaneSmith\t15.00\thttps://eldorado.gg/...`}
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                    />
                    <div className="import-actions mt-1">
                        <button className="btn-primary" onClick={handleImport}>Process Data</button>
                        <button className="btn-secondary" onClick={() => setShowImport(false)}>Cancel</button>
                    </div>
                </div>
            )}

            <div className="orders-container glass-card">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Eldorado ID</th>
                            <th>Buyer</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Assign To</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {eldoradoOrders.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>No pending Eldorado orders to convert</td>
                            </tr>
                        ) : (
                            eldoradoOrders.map((order) => (
                                <EldoradoOrderRow
                                    key={order.eldorado_id}
                                    order={order}
                                    workers={workers}
                                    handleConvert={handleConvert}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EldoradoOrders;
