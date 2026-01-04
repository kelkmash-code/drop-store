import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Minus, Package, TrendingUp, AlertCircle, ShoppingCart, Search } from 'lucide-react';
import FruitOrderModal from '../components/FruitOrderModal';

const BloxFruits = () => {
    const { API_URL, user } = useAuth();
    const [fruits, setFruits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        fetchFruits();
    }, []);

    const fetchFruits = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/blox-fruits`);
            setFruits(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStock = async (id, mode, quantity = 0) => {
        setUpdating(id);
        try {
            await axios.patch(`${API_URL}/blox-fruits/${id}/stock`, { mode, quantity });
            // Optimistic update
            setFruits(prev => prev.map(f => {
                if (f.id !== id) return f;
                let newQ = f.quantity;
                if (mode === 'increment') newQ++;
                if (mode === 'decrement') newQ = Math.max(0, newQ - 1);
                return { ...f, quantity: newQ };
            }));
        } catch (err) {
            console.error(err);
            fetchFruits(); // Revert on error
        } finally {
            setUpdating(null);
        }
    };

    const getRarityColor = (rarity) => {
        const colors = {
            'Common': '#94a3b8',
            'Uncommon': '#10b981',
            'Rare': '#3b82f6',
            'Legendary': '#a855f7',
            'Mythical': '#ef4444'
        };
        return colors[rarity] || '#ffffff';
    };

    const filteredFruits = fruits.filter(f =>
        f.name.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="blox-fruits-view">
            <header className="header">
                <div className="header-title">
                    <h2>Blox Fruits Inventory</h2>
                    <p className="text-muted">Manage your fruit stock and process orders</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar glass-input" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', marginRight: '1rem' }}>
                        <Search size={18} className="text-muted" />
                        <input
                            type="text"
                            placeholder="Search fruits..."
                            style={{ background: 'transparent', border: 'none', color: 'white', marginLeft: '0.5rem', outline: 'none' }}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary flex-between" onClick={() => setShowOrderModal(true)}>
                        <ShoppingCart size={18} />
                        <span style={{ marginLeft: '0.5rem' }}>Create Order</span>
                    </button>
                </div>
            </header>

            <div className="stats-row mb-2">
                <div className="glass-card stat-card">
                    <Package className="text-primary" size={32} />
                    <div>
                        <h3>{fruits.reduce((acc, f) => acc + f.quantity, 0)}</h3>
                        <p className="text-muted">Total Items</p>
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <TrendingUp className="text-success" size={32} />
                    <div>
                        <h3>{fruits.length}</h3>
                        <p className="text-muted">Fruit Types</p>
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div className="rarity-distribution">
                        {/* Mini visualization could go here */}
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'end', height: '32px' }}>
                            {['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythical'].map(r => {
                                const count = fruits.filter(f => f.rarity === r && f.quantity > 0).length;
                                return (
                                    <div key={r} style={{
                                        width: '8px',
                                        height: `${Math.max(10, count * 2)}%`,
                                        background: getRarityColor(r),
                                        borderRadius: '2px',
                                        opacity: 0.8
                                    }} title={r} />
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <h3>{fruits.filter(f => f.quantity > 0).length}</h3>
                        <p className="text-muted">Active Types</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading inventory...</div>
            ) : (
                <div className="fruit-grid">
                    {filteredFruits.length === 0 ? (
                        <div className="no-data glass-card">
                            <AlertCircle size={48} />
                            <p>No fruits found.</p>
                        </div>
                    ) : (
                        filteredFruits.map((fruit) => (
                            <div key={fruit.id} className={`fruit-card border-${fruit.rarity}`}>
                                <div className="fruit-image-container">
                                    {fruit.image_url ? (
                                        <img
                                            src={fruit.image_url}
                                            alt={fruit.name}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                    ) : (
                                        <div className="fruit-placeholder"><Package size={40} /></div>
                                    )}
                                    <div className="fruit-placeholder" style={{ display: 'none' }}><Package size={40} /></div>

                                    <span className="stock-badge">{fruit.quantity}</span>

                                    <div className="manual-stock-controls">
                                        <button
                                            className="btn-icon-sm"
                                            onClick={(e) => { e.stopPropagation(); updateStock(fruit.id, 'decrement'); }}
                                            disabled={updating === fruit.id}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <button
                                            className="btn-icon-sm"
                                            onClick={(e) => { e.stopPropagation(); updateStock(fruit.id, 'increment'); }}
                                            disabled={updating === fruit.id}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="fruit-info">
                                    <h3 className="fruit-name" style={{ color: getRarityColor(fruit.rarity) }}>{fruit.name}</h3>
                                    <div className="fruit-meta">
                                        <span className="rarity-pill" style={{ color: getRarityColor(fruit.rarity), border: `1px solid ${getRarityColor(fruit.rarity)}40` }}>
                                            {fruit.rarity}
                                        </span>
                                        <span className="price-tag">${fruit.price.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {showOrderModal && (
                <FruitOrderModal
                    fruits={fruits.filter(f => f.quantity > 0)}
                    onClose={() => setShowOrderModal(false)}
                    onSuccess={fetchFruits}
                />
            )}
        </div>
    );
};

export default BloxFruits;
