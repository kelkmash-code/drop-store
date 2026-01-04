import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Trophy, Calendar, Target, Award, Plus, Trash2, Power } from 'lucide-react';

const Campaigns = () => {
    const { API_URL, user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'order_count',
        target_value: '',
        reward: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/campaigns`);
            setCampaigns(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/campaigns`, formData);
            setShowForm(false);
            setFormData({
                title: '', description: '', type: 'order_count', target_value: '', reward: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
            fetchCampaigns();
        } catch (err) {
            alert('Failed to create campaign');
        }
    };

    const handleToggle = async (id) => {
        try {
            await axios.post(`${API_URL}/campaigns/${id}/toggle`);
            fetchCampaigns();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this campaign?')) return;
        try {
            await axios.delete(`${API_URL}/campaigns/${id}`);
            fetchCampaigns();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="loading-state">Loading campaigns...</div>;

    return (
        <div className="campaigns-page">
            <div className="header mb-2 flex-between">
                <div>
                    <h2>Worker Bonuses & Campaigns</h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {isAdmin ? 'Manage performance targets and rewards' : 'Track your progress and earn rewards'}
                    </p>
                </div>
                {isAdmin && (
                    <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                        <Plus size={18} style={{ marginRight: '8px' }} />
                        New Campaign
                    </button>
                )}
            </div>

            <div className="campaigns-grid">
                {campaigns.length === 0 ? (
                    <div className="empty-state">No active campaigns.</div>
                ) : (
                    campaigns.map(c => (
                        <div key={c.id} className={`glass-card campaign-card ${c.is_active ? 'active' : 'inactive'} ${c.isCompleted ? 'completed-glow' : ''}`}>
                            <div className="card-header">
                                <div className="icon-badge">
                                    <Trophy size={20} color={c.isCompleted ? '#F59E0B' : 'white'} />
                                </div>
                                <div className="header-text">
                                    <h3>{c.title}</h3>
                                    <span className="reward-tag">
                                        <Award size={14} style={{ marginRight: '4px' }} />
                                        {c.reward}
                                    </span>
                                </div>
                                {isAdmin && (
                                    <div className="admin-actions">
                                        <button onClick={() => handleToggle(c.id)} className="btn-icon">
                                            <Power size={16} color={c.is_active ? '#4ade80' : '#ef4444'} />
                                        </button>
                                        <button onClick={() => handleDelete(c.id)} className="btn-icon danger">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="description">{c.description || 'No description provided.'}</p>

                            <div className="meta-dates">
                                <Calendar size={14} />
                                {new Date(c.start_date).toLocaleDateString()} - {new Date(c.end_date).toLocaleDateString()}
                            </div>

                            <div className="progress-section">
                                <div className="progress-labels">
                                    <span>Progress</span>
                                    <span>
                                        {c.type === 'revenue_sum' ? '$' : ''}{c.userProgress?.toFixed(0) || 0} / {c.target_value}
                                        {c.type === 'order_count' ? ' Orders' : ''}
                                    </span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div
                                        className={`progress-bar-fill ${c.isCompleted ? 'success' : ''}`}
                                        style={{ width: `${Math.min((c.userProgress / c.target_value) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {c.isCompleted && (
                                <div className="completion-badge">
                                    <Target size={16} /> Target Met!
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card">
                        <div className="modal-header">
                            <h2>Create New Campaign</h2>
                            <button onClick={() => setShowForm(false)} className="btn-icon"><Trash2 size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text" required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Weekend Rush"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>Goal Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="order_count">Order Count</option>
                                        <option value="revenue_sum">Revenue Generated</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Target Value</label>
                                    <input
                                        type="number" required
                                        value={formData.target_value}
                                        onChange={e => setFormData({ ...formData, target_value: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Reward </label>
                                <input
                                    type="text" required
                                    value={formData.reward}
                                    onChange={e => setFormData({ ...formData, reward: e.target.value })}
                                    placeholder="e.g. $50 Bonus"
                                />
                            </div>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date" required
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input
                                        type="date" required
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create Campaign</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .campaigns-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                }
                .campaign-card {
                    padding: 1.5rem;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.2s;
                }
                .campaign-card:hover {
                    transform: translateY(-4px);
                }
                .campaign-card.inactive {
                    opacity: 0.6;
                    filter: grayscale(0.8);
                }
                .completed-glow {
                    border: 1px solid rgba(245, 158, 11, 0.5);
                    box-shadow: 0 0 15px rgba(245, 158, 11, 0.1);
                }
                .card-header {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .icon-badge {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, var(--primary), #818cf8);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .header-text {
                    flex: 1;
                }
                .header-text h3 {
                    font-size: 1.1rem;
                    margin-bottom: 0.25rem;
                }
                .reward-tag {
                    display: inline-flex;
                    align-items: center;
                    background: rgba(255, 215, 0, 0.1);
                    color: gold;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .description {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
line-height: 1.4;
                }
                .meta-dates {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-bottom: 1rem;
                }
                .progress-section {
                    margin-top: auto;
                }
                .progress-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85rem;
                    margin-bottom: 0.5rem;
                }
                .progress-bar-bg {
                    height: 8px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%;
                    background: var(--primary);
                    border-radius: 4px;
                    transition: width 0.5s ease-out;
                }
                .progress-bar-fill.success {
                    background: #10b981;
                }
                .completion-badge {
                    margin-top: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    padding: 0.5rem;
                    border-radius: 8px;
                    font-weight: 600;
                }
                .admin-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                .form-grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
            `}</style>
        </div>
    );
};

export default Campaigns;
