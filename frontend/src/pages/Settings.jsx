import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const { API_URL, user } = useAuth();
    const navigate = useNavigate();
    const [resetting, setResetting] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    if (user?.role !== 'admin') {
        return <div className="p-8 text-center">Admin access only</div>;
    }

    const handleReset = async () => {
        if (confirmText !== 'DELETE EVERYTHING') {
            return alert('Please type DELETE EVERYTHING to confirm.');
        }

        if (!confirm('FINAL WARNING: This will wipe all orders, history, and expenses. Are you absolutely sure?')) {
            return;
        }

        setResetting(true);
        try {
            await axios.post(`${API_URL}/admin/reset`);
            alert('System has been reset successfully.');
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Reset failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="page-container">
            <Header title="System Settings" />

            <div className="content-scrollable">
                <div className="glass-card p-6 max-w-2xl mx-auto mt-8 border-red-500/30">
                    <div className="flex items-center gap-3 mb-4 text-red-500">
                        <AlertTriangle size={32} />
                        <h2>Danger Zone</h2>
                    </div>

                    <p className="text-muted mb-6">
                        Use this section to reset the system for a fresh start.
                        This is useful after testing or when starting a new season.
                    </p>

                    <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 mb-6">
                        <h3 className="text-red-400 mb-2 font-bold">Fresh Start (Database Wipe)</h3>
                        <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1 mb-4">
                            <li>Deletes ALL active and completed orders.</li>
                            <li>Deletes ALL order history and work logs.</li>
                            <li>Deletes ALL expenses and financial data.</li>
                            <li>Resets Blox Fruits stock to 0.</li>
                            <li><strong>Does NOT delete:</strong> Admin/Worker accounts, Account names, Scripts.</li>
                        </ul>

                        <div className="flex flex-col gap-3">
                            <label className="text-xs uppercase tracking-wider text-muted">Type "DELETE EVERYTHING" to confirm</label>
                            <input
                                type="text"
                                className="form-input border-red-500/30 focus:border-red-500"
                                placeholder="DELETE EVERYTHING"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                            />
                            <button
                                onClick={handleReset}
                                disabled={resetting || confirmText !== 'DELETE EVERYTHING'}
                                className="btn-primary bg-red-600 hover:bg-red-700 w-full justify-center mt-2"
                            >
                                {resetting ? 'Wiping Data...' : 'Wipe Data & Reset System'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
