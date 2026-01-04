import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Trash2, UserPlus, Shield, User } from 'lucide-react';

const Users = () => {
    const { API_URL, user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'worker'
    });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/users`);
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`${API_URL}/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await axios.post(`${API_URL}/users`, formData);
            setShowModal(false);
            setFormData({ username: '', password: '', role: 'worker' });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create user');
        }
    };

    if (!isAdmin) return <div className="p-8 text-center text-red-400">Access Denied</div>;

    return (
        <div className="page-content">
            <div className="header">
                <div className="header-title">
                    <h2>User Management</h2>
                    <p className="text-muted">Create and manage admin and worker accounts</p>
                </div>
                <div className="header-actions">
                    <button onClick={() => setShowModal(true)} className="btn-primary flex-center gap-2">
                        <UserPlus size={18} />
                        Add New User
                    </button>
                </div>
            </div>

            <div className="glass-card orders-container">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td className="flex items-center gap-3">
                                    <div className={`icon-circle-sm ${u.role === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                                        {u.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
                                    </div>
                                    <span className="font-medium">{u.username}</span>
                                    {u.id === user.id && <span className="text-xs text-muted ml-2">(You)</span>}
                                </td>
                                <td>
                                    <span className={`status-badge ${u.role === 'admin' ? 'status-working' : 'status-new'}`}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td className="text-right">
                                    {u.id !== user.id && (
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="btn-icon text-danger hover:bg-danger/10"
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Create New User</h3>
                            <button onClick={() => setShowModal(false)} className="btn-icon">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            {error && <div className="error-badge">{error}</div>}

                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="text"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    placeholder="Enter initial password"
                                />
                            </div>

                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="worker">Worker</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
