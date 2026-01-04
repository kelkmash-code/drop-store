import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Trash2, Power, Mail, Shield } from 'lucide-react';

const Accounts = () => {
    const { API_URL, user } = useAuth();
    if (user?.role !== 'admin') return <div className="p-4">Access Denied</div>;

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '' });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/accounts`);
            setAccounts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return;
        try {
            await axios.post(`${API_URL}/accounts`, formData);
            setFormData({ name: '', email: '' });
            fetchAccounts();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add account');
        }
    };

    const handleToggle = async (id) => {
        try {
            await axios.patch(`${API_URL}/accounts/${id}/toggle`);
            setAccounts(accounts.map(a =>
                a.id === id ? { ...a, is_active: !a.is_active } : a
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this account?')) return;
        try {
            await axios.delete(`${API_URL}/accounts/${id}`);
            setAccounts(accounts.filter(a => a.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="accounts-page">
            <header className="header mb-2">
                <div>
                    <h2>Aldorado Accounts</h2>
                    <p className="text-muted">Manage the accounts used to fulfill orders</p>
                </div>
            </header>

            <div className="content-grid">
                {/* Add Form */}
                <div className="glass-card p-4 h-fit">
                    <h3 className="mb-1">Add New Account</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Account Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Main Account"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email (Optional)</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="account@example.com"
                            />
                        </div>
                        <button type="submit" className="btn-primary w-full mt-1">
                            <Plus size={18} style={{ marginRight: '6px' }} />
                            Add Account
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="glass-card">
                    {loading ? (
                        <div className="p-4 text-center">Loading...</div>
                    ) : accounts.length === 0 ? (
                        <div className="p-4 text-center text-muted">No accounts added yet.</div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-white/10">
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map(acc => (
                                    <tr key={acc.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-3">
                                            <div className={`status-dot ${acc.is_active ? 'online' : 'offline'}`} title={acc.is_active ? 'Active' : 'Inactive'}></div>
                                        </td>
                                        <td className="p-3 font-medium">{acc.name}</td>
                                        <td className="p-3 text-muted">{acc.email || '-'}</td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => handleToggle(acc.id)}
                                                className="btn-icon mr-1"
                                                title={acc.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                <Power size={16} color={acc.is_active ? '#4ade80' : '#ef4444'} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(acc.id)}
                                                className="btn-icon danger"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <style jsx>{`
                .content-grid {
                    display: grid;
                    grid-template-columns: 300px 1fr;
                    gap: 1.5rem;
                }
                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .status-dot.online { background-color: #4ade80; box-shadow: 0 0 8px rgba(74, 222, 128, 0.4); }
                .status-dot.offline { background-color: #ef4444; }
                @media (max-width: 768px) {
                    .content-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default Accounts;
