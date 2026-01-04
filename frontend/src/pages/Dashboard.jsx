import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import OrdersList from './OrdersList';
import EldoradoOrders from './EldoradoOrders';
import BloxFruits from './BloxFruits';
import Analytics from './Analytics';
import Expenses from './Expenses';
import Campaigns from './Campaigns';
import Accounts from './Accounts';
import Users from './Users';
import Scripts from './Scripts';
import WorkerHome from './WorkerHome';

const Dashboard = () => {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content">
                <div className="page-content">
                    <Routes>
                        <Route path="/" element={<WorkerHome />} />
                        <Route path="/orders" element={<OrdersList />} />
                        <Route path="/eldorado" element={<EldoradoOrders />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/blox-fruits" element={<BloxFruits />} />
                        <Route path="/active" element={<OrdersList filter="working" />} />
                        <Route path="/completed" element={<OrdersList filter="completed" />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/campaigns" element={<Campaigns />} />
                        <Route path="/scripts" element={<Scripts />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
