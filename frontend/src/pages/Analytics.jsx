import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { DollarSign, ShoppingCart, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';

const Analytics = () => {
    const { API_URL } = useAuth();
    const [dailyStats, setDailyStats] = useState(null);
    const [weeklyStats, setWeeklyStats] = useState([]);
    const [workerStats, setWorkerStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchAnalytics();
    }, [selectedDate]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [dailyRes, weeklyRes, workersRes] = await Promise.all([
                axios.get(`${API_URL}/analytics/daily?date=${selectedDate}`),
                axios.get(`${API_URL}/analytics/weekly?date=${selectedDate}`),
                axios.get(`${API_URL}/analytics/workers`)
            ]);
            setDailyStats(dailyRes.data);
            setWeeklyStats(weeklyRes.data);
            setWorkerStats(workersRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-state">Loading analytics...</div>;

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="glass-card stat-card-modern">
            <div className="stat-icon" style={{ background: `rgba(${color}, 0.1)`, color: `rgb(${color})` }}>
                <Icon size={24} />
            </div>
            <div className="stat-info">
                <h3>{value}</h3>
                <p>{title}</p>
                {subtext && <span className="stat-subtext">{subtext}</span>}
            </div>
        </div>
    );

    const maxWeeklyRevenue = Math.max(...weeklyStats.map(d => d.revenue), 1);

    return (
        <div className="analytics-page">
            <div className="header mb-2 flex-between">
                <div className="header-title">
                    <h2>Analytics Dashboard</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Overview of performance and revenue</p>
                </div>
                <div className="date-picker-container">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="glass-input"
                    />
                </div>
            </div>

            {/* Daily Stats Grid */}
            <div className="stats-grid mb-2">
                <StatCard
                    title="Today's Revenue"
                    value={`$${dailyStats?.revenue?.toFixed(2) || '0.00'}`}
                    icon={DollarSign}
                    color="16, 185, 129"
                />
                <StatCard
                    title="New Orders"
                    value={dailyStats?.newOrders}
                    icon={ShoppingCart}
                    color="99, 102, 241"
                    subtext="Today"
                />
                <StatCard
                    title="Completed"
                    value={dailyStats?.completed}
                    icon={CheckCircle2}
                    color="245, 158, 11"
                    subtext="Today"
                />
                <StatCard
                    title="Net Profit"
                    value={`$${dailyStats?.netProfit?.toFixed(2) || '0.00'}`}
                    icon={TrendingUp}
                    color={dailyStats?.netProfit >= 0 ? "16, 185, 129" : "239, 68, 68"}
                    subtext="Revenue - Expenses"
                />
                <StatCard
                    title="Expenses"
                    value={`$${dailyStats?.expenses?.toFixed(2) || '0.00'}`}
                    icon={DollarSign}
                    color="239, 68, 68"
                    subtext="Today"
                />
            </div>

            <div className="grid-2-1">
                {/* Weekly Revenue Chart */}
                <div className="glass-card p-2 animate-up">
                    <h3 className="card-title mb-1">
                        <Calendar size={18} />
                        7 Day Revenue Trend
                    </h3>
                    <div className="chart-container">
                        {weeklyStats.map((day, i) => (
                            <div key={i} className="chart-bar-group">
                                <div
                                    className="chart-bar"
                                    style={{
                                        height: `${(day.revenue / maxWeeklyRevenue) * 100}%`,
                                        opacity: day.revenue > 0 ? 1 : 0.3
                                    }}
                                    title={`$${day.revenue}`}
                                >
                                    {day.revenue > 0 && <span className="bar-tooltip">${day.revenue}</span>}
                                </div>
                                <span className="chart-label">
                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day by Day Table */}
                <div className="glass-card p-2 animate-up delay-1">
                    <h3 className="card-title mb-1">Weekly Breakdown</h3>
                    <div className="table-responsive">
                        <table className="analytics-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Orders</th>
                                    <th>Rev</th>
                                </tr>
                            </thead>
                            <tbody>
                                {weeklyStats.slice().reverse().map((day, i) => (
                                    <tr key={i}>
                                        <td>{new Date(day.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className="badge-orders">{day.newOrders}</span>
                                            {day.completed > 0 && <span className="badge-completed">✓{day.completed}</span>}
                                        </td>
                                        <td className="text-success font-mono">${day.revenue.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Worker Analytics Section */}
            <div className="glass-card p-2 animate-up delay-1 mb-2" style={{ marginTop: '1.5rem' }}>
                <h3 className="card-title mb-1">Worker Performance</h3>
                <div className="table-responsive">
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>Worker</th>
                                <th className="p-3">Total Orders</th>
                                <th className="p-3">Completed</th>
                                <th className="p-3">Hours Worked</th>
                                <th className="p-3">Orders / Hr</th>
                                <th className="p-3 text-right">Revenue Generated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workerStats.map((w) => (
                                <tr key={w.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div className="worker-avatar-sm" style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                background: 'var(--primary)', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.7rem'
                                            }}>
                                                {w.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            {w.username}
                                        </div>
                                    </td>
                                    <td className="p-3 font-medium">{w.total_orders}</td>
                                    <td className="p-3 text-success">{w.completed_orders}</td>
                                    <td className="p-3 text-muted">{w.hours_worked || 0} hrs</td>
                                    <td className="p-3">
                                        <span className={`role-badge ${w.orders_per_hour >= 1 ? 'admin' : 'worker'}`}>
                                            {w.orders_per_hour || 0}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right font-mono text-success">${w.revenue_generated.toFixed(2)}</td>
                                </tr>
                            ))}
                            {workerStats.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No worker data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                }
                .stat-card-modern {
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    transition: transform 0.2s;
                }
                .stat-card-modern:hover {
                    transform: translateY(-4px);
                }
                .stat-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-info h3 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    line-height: 1;
                    margin-bottom: 0.25rem;
                }
                .stat-info p {
                    color: var(--text-muted);
                    font-size: 0.875rem;
                }
                .stat-subtext {
                    font-size: 0.75rem;
                    background: rgba(255,255,255,0.05);
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 0.5rem;
                }
                .grid-2-1 {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 1.5rem;
                }
                .p-2 { padding: 1.5rem; }
                .mb-1 { margin-bottom: 1rem; }
                .card-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.1rem;
                }
                .chart-container {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    height: 250px;
                    padding-top: 2rem;
                    gap: 0.5rem;
                }
                .chart-bar-group {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                    height: 100%;
                    gap: 0.5rem;
                }
                .chart-bar {
                    width: 100%;
                    background: linear-gradient(to top, var(--primary), #818cf8);
                    border-radius: 8px 8px 0 0;
                    position: relative;
                    min-height: 4px;
                    transition: height 0.5s ease-out;
                    margin-top: auto; /* Push to bottom */
                }
                .chart-bar:hover .bar-tooltip {
                    opacity: 1;
                    transform: translateX(-50%) translateY(-5px);
                }
                .bar-tooltip {
                    position: absolute;
                    top: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.8);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    opacity: 0;
                    transition: all 0.2s;
                    white-space: nowrap;
                    pointer-events: none;
                }
                .chart-label {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .analytics-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }
                .analytics-table th {
                    text-align: left;
                    color: var(--text-muted);
                    padding: 0.5rem;
                    font-weight: 500;
                    border-bottom: 1px solid var(--border);
                }
                .analytics-table td {
                    padding: 0.75rem 0.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .font-mono { font-family: monospace; }
                .badge-orders {
                    background: rgba(255,255,255,0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-right: 4px;
                }
                .badge-completed {
                    color: var(--success);
                    font-size: 0.75rem;
                }
                .animate-up {
                   animation: fadeUp 0.5s ease backwards;
                }
                .delay-1 { animation-delay: 0.1s; }
                .glass-input {
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    outline: none;
                    font-family: inherit;
                    cursor: pointer;
                }
                .glass-input:focus {
                    border-color: var(--primary);
                }
                ::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    cursor: pointer;
                }
                @media (max-width: 1024px) {
                    .grid-2-1 { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default Analytics;
