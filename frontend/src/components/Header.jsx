import React from 'react';
import { Search, Bell, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ onAddOrder }) => {
    const { user } = useAuth();

    return (
        <header className="header">
            <div className="header-title">
                <h2>Dashboard</h2>
                <p className="text-muted">Welcome back, {user?.username}!</p>
            </div>

            <div className="header-actions">
                <div className="search-bar">
                    <Search size={18} />
                    <input type="text" placeholder="Search orders..." />
                </div>

                {(user?.role === 'admin' || user?.role === 'worker') && (
                    <button className="btn-primary flex-between" onClick={onAddOrder}>
                        <Plus size={18} />
                        <span style={{ marginLeft: '0.5rem' }}>New Order</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
