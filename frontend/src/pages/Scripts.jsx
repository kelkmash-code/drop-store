import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Copy, ExternalLink, Code, Save, X, Search, Check } from 'lucide-react';
import './Scripts.css'; // Import the new CSS file

const Scripts = () => {
    const { user } = useAuth();
    const [scripts, setScripts] = useState([]);
    const [filteredScripts, setFilteredScripts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', content: '', source_link: '', notes: '' });
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        fetchScripts();
    }, []);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredScripts(scripts);
        } else {
            const lowerQ = searchQuery.toLowerCase();
            setFilteredScripts(scripts.filter(s =>
                s.name.toLowerCase().includes(lowerQ) ||
                s.notes?.toLowerCase().includes(lowerQ)
            ));
        }
    }, [searchQuery, scripts]);

    const fetchScripts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/scripts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setScripts(res.data);
            setFilteredScripts(res.data);
        } catch (err) {
            console.error('Failed to fetch scripts');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/scripts', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            setFormData({ name: '', content: '', source_link: '', notes: '' });
            fetchScripts();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this script?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/scripts/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchScripts();
        } catch (err) {
            console.error(err);
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="scripts-container">
            {/* Header Section */}
            <div className="scripts-header">
                <div className="scripts-title">
                    <h1>
                        <Code className="text-purple-400" size={32} />
                        Script Manager
                    </h1>
                    <p>Manage and organize your essential scripts</p>
                </div>

                <div className="scripts-actions">
                    <div className="search-wrapper">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search scripts..."
                            className="search-input"
                        />
                        <Search className="search-icon" size={16} />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary"
                    >
                        <Plus size={18} />
                        Add Script
                    </button>
                </div>
            </div>

            {/* Grid */}
            {filteredScripts.length > 0 ? (
                <div className="scripts-grid">
                    {filteredScripts.map((script) => (
                        <div key={script.id} className="script-card">
                            {/* Card Header */}
                            <div className="card-header">
                                <div className="card-title">
                                    <h3>{script.name}</h3>
                                    {script.source_link && (
                                        <a
                                            href={script.source_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="source-link"
                                        >
                                            <ExternalLink size={12} />
                                            Source Link
                                        </a>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(script.id)}
                                    className="btn-icon"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Card Body */}
                            <div className="card-body">
                                <div className="code-block">
                                    <div className="code-header">
                                        <span className="lang-tag">Lua Script</span>
                                        <button
                                            onClick={() => copyToClipboard(script.content, script.id)}
                                            className="btn-copy"
                                        >
                                            {copiedId === script.id ? (
                                                <><Check size={12} /> Copied</>
                                            ) : (
                                                <><Copy size={12} /> Copy</>
                                            )}
                                        </button>
                                    </div>
                                    <div className="code-content">
                                        {script.content}
                                    </div>
                                </div>

                                {script.notes && (
                                    <div className="script-notes">
                                        <span className="notes-label">Notes</span>
                                        <p className="notes-text">{script.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="card-footer">
                                <span>Created {new Date(script.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">
                        <Code size={32} style={{ opacity: 0.5 }} />
                    </div>
                    <p className="text-lg font-medium">No scripts found</p>
                    <p className="text-sm opacity-60">Add a new script to get started</p>
                </div>
            )}

            {/* Add Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>
                                <Plus size={20} style={{ color: 'var(--primary)' }} />
                                New Script
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn-close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Script Role</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="form-input"
                                        placeholder="Name your script..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Source Link</label>
                                    <input
                                        type="url"
                                        value={formData.source_link}
                                        onChange={e => setFormData({ ...formData, source_link: e.target.value })}
                                        className="form-input"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Code</label>
                                    <textarea
                                        required
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        className="form-textarea code"
                                        placeholder="LUA script content..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="form-textarea"
                                        placeholder="Instructions..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-submit"
                                >
                                    {loading ? 'Saving...' : <><Save size={18} /> Save Script</>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scripts;
