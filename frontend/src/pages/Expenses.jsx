import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, DollarSign } from 'lucide-react';

const Expenses = () => {
    const { API_URL } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'General',
        notes: ''
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/expenses`);
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/expenses`, formData);
            setFormData({ title: '', amount: '', category: 'General', notes: '' });
            setShowForm(false);
            fetchExpenses();
        } catch (err) {
            alert('Failed to add expense');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await axios.delete(`${API_URL}/expenses/${id}`);
            fetchExpenses();
        } catch (err) {
            console.error(err);
        }
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return (
        <div className="expenses-page">
            <div className="header mb-2 flex-between">
                <div>
                    <h2>Expenses</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Manage operational costs</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Add Expense
                </button>
            </div>

            <div className="stats-grid mb-2">
                <div className="glass-card stat-card-modern">
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>${totalExpenses.toFixed(2)}</h3>
                        <p>Total Expenses Recorded</p>
                    </div>
                </div>
            </div>

            <div className="main-content grid-2-1">
                <div className="glass-card p-2">
                    <h3 className="card-title mb-1">Recent Expenses</h3>
                    <div className="table-responsive">
                        <table className="expenses-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted">No expenses recorded</td>
                                    </tr>
                                ) : (
                                    expenses.map(e => (
                                        <tr key={e.id}>
                                            <td>
                                                <div className="font-600">{e.title}</div>
                                                {e.notes && <div className="text-sm text-muted">{e.notes}</div>}
                                            </td>
                                            <td><span className="badge-category">{e.category}</span></td>
                                            <td className="text-danger font-mono">-${e.amount.toFixed(2)}</td>
                                            <td>{new Date(e.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <button className="btn-icon danger" onClick={() => handleDelete(e.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showForm && (
                    <div className="glass-card p-2 animate-up">
                        <h3 className="card-title mb-1">New Expense</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Server Hosting"
                                />
                            </div>
                            <div className="form-group">
                                <label>Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="General">General</option>
                                    <option value="Hosting">Hosting</option>
                                    <option value="Advertising">Advertising</option>
                                    <option value="Salaries">Salaries</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    rows="2"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn-primary full-width">Save Expense</button>
                        </form>
                    </div>
                )}
            </div>

            <style jsx>{`
                .expenses-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .expenses-table th {
                    text-align: left;
                    padding: 0.75rem;
                    color: var(--text-muted);
                    border-bottom: 1px solid var(--border);
                }
                .expenses-table td {
                    padding: 0.75rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .btn-icon.danger:hover {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                }
                .text-danger { color: #ef4444; }
                .badge-category {
                    background: rgba(255,255,255,0.1);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                }
                .grid-2-1 {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 1.5rem;
                }
                @media (max-width: 768px) {
                    .grid-2-1 { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default Expenses;
