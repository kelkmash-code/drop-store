import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';

const ChatWidget = () => {
    const { user, API_URL } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [minimized, setMinimized] = useState(false);
    const messagesEndRef = useRef(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Filter to only show messages from last 24h optionally, or just last 50
    // State to track last fetched timestamp to optimize polling
    const [lastTimestamp, setLastTimestamp] = useState(null);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0); // Mark as read when opening
            fetchMessages(true); // Fetch immediately
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Polling Logic
    useEffect(() => {
        if (!user) return;

        // Initial fetch
        fetchMessages(true);

        const interval = setInterval(() => {
            fetchMessages(false);
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [user, isOpen]); // Rerun if user changes, or isOpen changes (to reset unread maybe?)

    const fetchMessages = async (isInitial = false) => {
        try {
            // If fetching history (initial), don't send 'after'. 
            // If polling, send 'after' the last message we have.
            let url = `${API_URL}/chat?channel=global`;

            // Optimization: If we have messages, only ask for newer ones
            // But for simplicity/robustness on 'initial', we just get last 50.
            // For polling, we could optimize, but simpler to just get last 50 and merge/dedupe 
            // OR strictly stick to 'after' logic. 
            // Let's stick to "Get last 50" for now to avoid "missed message" gaps if client time is weird.,
            // Actually, simply getting all recent is safer for consistency.

            const res = await axios.get(url);
            const newMsgs = res.data; // Server returns sorted by Date ASC

            // Dedupe merge logic
            setMessages(prev => {
                const combined = [...prev];
                let addedCount = 0;
                newMsgs.forEach(msg => {
                    if (!combined.some(m => m.id === msg.id)) {
                        combined.push(msg);
                        addedCount++;
                    }
                });

                // If closed and new messages arrived, increment unread
                if (!isOpen && !isInitial && addedCount > 0) {
                    setUnreadCount(c => c + addedCount);
                }

                // Sort again to be sure
                return combined.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            });

        } catch (err) {
            console.error("Chat poll failed", err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await axios.post(`${API_URL}/chat`, { content: newMessage });
            setNewMessage('');
            fetchMessages(); // Create immediate feedback
        } catch (err) {
            alert('Failed to send');
        }
    };

    if (!user) return null;

    if (!isOpen) {
        return (
            <div
                onClick={toggleOpen}
                className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg cursor-pointer transition-all hover:scale-105 flex items-center justify-center group"
            >
                <MessageCircle size={28} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                {/* Tooltip */}
                <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    Team Chat
                </span>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300" style={{ height: '500px', maxHeight: '80vh' }}>
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                    <MessageCircle size={20} />
                    <h3 className="font-bold">Team Chat</h3>
                    <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full text-blue-100">Global</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={toggleOpen} className="p-1 hover:bg-blue-500 rounded transition">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                {messages.length === 0 ? (
                    <div className="text-center text-muted text-sm mt-10">
                        <p>No messages yet.</p>
                        <p>Say hello to the team! 👋</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender_id === user.id;
                        const showName = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {showName && !isMe && (
                                    <span className="text-xs text-muted ml-1 mb-1">{msg.sender_name}</span>
                                )}
                                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-muted mt-1 px-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatWidget;
