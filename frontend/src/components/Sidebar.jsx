import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingBag,
    Users, // Keep existing Users import for now as usage isn't changed
    Clock,
    CheckCircle2,
    PlusSquare,
    LogOut,
    Package,
    BarChart3,
    Wallet,
    Zap,
    Trophy,
    Users as UsersIcon,
    Briefcase,
    Calendar,
    Code,
    Settings as SettingsIcon
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const navItems = [
        { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/orders', icon: <Briefcase size={20} />, label: 'All Orders' },
        { to: '/active', icon: <Clock size={20} />, label: 'Active Work' },
        { to: '/blox-fruits', icon: <Package size={20} />, label: 'Blox Fruits' },
        { to: '/completed', icon: <CheckCircle2 size={20} />, label: 'Completed' },
        { to: '/campaigns', icon: <Trophy size={20} />, label: 'Bonuses' },
        { to: '/scripts', icon: <Code size={20} />, label: 'Scripts' },
    ];

    if (user?.role === 'admin') {
        navItems.push(
            { to: '/eldorado', icon: <ShoppingBag size={20} />, label: 'Eldorado Orders' },
            { to: '/users', icon: <UsersIcon size={20} />, label: 'Users' },
            { to: '/accounts', icon: <Briefcase size={20} />, label: 'Accounts' },
            { to: '/expenses', icon: <Wallet size={20} />, label: 'Expenses' },
            { to: '/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
            { to: '/settings', icon: <SettingsIcon size={20} />, label: 'Settings' }
        );
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">D</div>
                <span>DROP Store</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <p className="username">{user?.username}</p>
                    <p className="role">{user?.role}</p>
                </div>
                <button onClick={logout} className="btn-logout">
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
