import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            console.log('Attempting login for:', username);
            await login(username, password);
            console.log('Login successful, navigating to dashboard...');
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.error || 'Failed to connect to server');
        }
    };

    return (
        <div className="login-container">
            <div className="glass-card login-card">
                <div className="login-header">
                    <div className="icon-circle">
                        <LogIn size={24} />
                    </div>
                    <h1>DROP Store</h1>
                    <p>Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-badge">{error}</div>}

                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
