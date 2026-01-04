import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Play, Trophy, Clock, CheckCircle2, Zap, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OrderModal from '../components/OrderModal'; // Import Modal
import './WorkerHome.css';

const WorkerHome = () => {
    const { user, API_URL } = useAuth();
    const navigate = useNavigate();
    const [activeOrders, setActiveOrders] = useState([]);
    const [stats, setStats] = useState({ today: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false); // Modal State

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ordersRes, analyticsRes] = await Promise.all([
                axios.get(`${API_URL}/orders`),
                axios.get(`${API_URL}/analytics/workers`)
            ]);

            const myActive = ordersRes.data.filter(
                o => o.assigned_worker_id === user.id && o.status === 'Working'
            );

            const myCompletedToday = ordersRes.data.filter(
                o => o.assigned_worker_id === user.id &&
                    o.status === 'Completed' &&
                    new Date(o.updated_at).toDateString() === new Date().toDateString()
            ).length;

            setActiveOrders(myActive);
            setStats({
                today: myCompletedToday,
                pending: myActive.length
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="worker-home">
            <header className="welcome-header">
                <div>
                    <h1>Welcome back, {user?.username}! 👋</h1>
                    <p>Ready to crush some goals today?</p>
                </div>
                <div className="quick-stats">
                    <div className="stat-pill">
                        <CheckCircle2 size={16} className="text-green-400" />
                        <span>{stats.today} Completed Today</span>
                    </div>
                    <div className="stat-pill">
                        <Trophy size={16} className="text-yellow-400" />
                        <span>View Bonuses</span>
                    </div>
                </div>
            </header>

            <section className="highlight-section">
                {activeOrders.length > 0 ? (
                    <div className="active-work-card">
                        <div className="card-status-bar">
                            <span className="status-badge pulse">In Progress</span>
                            <span className="time-badge"><Clock size={14} /> Started recently</span>
                        </div>
                        <div className="card-content">
                            <h2>{activeOrders[0].order_id}</h2>
                            <p className="order-desc">{activeOrders[0].title || 'Roblox Boosting Order'}</p>
                            <div className="order-details">
                                <span className="detail-tag">{activeOrders[0].account_username}</span>
                                <span className="detail-tag">${activeOrders[0].price}</span>
                            </div>
                        </div>
                        <div className="card-actions">
                            <button className="btn-resume" onClick={() => navigate('/active')}>
                                <Play size={20} fill="currentColor" /> Resume Work
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="empty-work-card">
                        <div className="icon-circle">
                            <Zap size={32} />
                        </div>
                        <h2>No active orders right now</h2>
                        <p>Check the queue to claim a new order!</p>
                        <button className="btn-find" onClick={() => window.open('https://www.eldorado.gg/', '_blank')}>
                            Find Work
                        </button>
                    </div>
                )}
            </section>

            {/* Quick Links with New Order Button */}
            <section className="quick-links">
                {/* NEW ORDER BUTTON */}
                <div className="link-card" onClick={() => setShowModal(true)}>
                    <div className="link-icon blue">
                        <PlusCircle size={24} />
                    </div>
                    <h3>New Order</h3>
                    <p>Create personal order</p>
                </div>

                <div className="link-card" onClick={() => navigate('/scripts')}>
                    <div className="link-icon purple">
                        <code>{'</>'}</code>
                    </div>
                    <h3>Scripts</h3>
                    <p>Grab auto-farm scripts</p>
                </div>
                <div className="link-card" onClick={() => navigate('/campaigns')}>
                    <div className="link-icon yellow">
                        <Trophy size={24} />
                    </div>
                    <h3>Bonuses</h3>
                    <p>Check your progress</p>
                </div>
                <div className="link-card" onClick={() => navigate('/completed')}>
                    <div className="link-icon green">
                        <CheckCircle2 size={24} />
                    </div>
                    <h3>History</h3>
                    <p>View past orders</p>
                </div>
            </section>

            {/* Render Modal */}
            {showModal && (
                <OrderModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        fetchData(); // Refresh to show new order immediately
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default WorkerHome;
