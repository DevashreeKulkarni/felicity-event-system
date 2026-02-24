import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const EventForum = ({ eventId, isOrganizer = false }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [sending, setSending] = useState(false);
    const socketRef = useRef(null);
    const bottomRef = useRef(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (!eventId) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        // 1. Load persisted messages via REST
        const loadMessages = async () => {
            try {
                const res = await api.get(`/forum/${eventId}/messages`);
                setMessages(res.data);
            } catch (err) {
                console.error('Forum load error:', err.message);
            } finally {
                setLoading(false);
            }
        };
        loadMessages();

        // 2. Connect Socket.IO
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling']
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join-forum', eventId);
        });

        socket.on('disconnect', () => setConnected(false));

        socket.on('new-message', (msg) => {
            setMessages(prev => {
                // Pinned messages always float to top
                const pinned = prev.filter(m => m.isPinned);
                const rest = prev.filter(m => !m.isPinned);
                return [...pinned, ...rest, msg];
            });
        });

        socket.on('message-deleted', ({ messageId }) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        });

        socket.on('message-pinned', ({ messageId, isPinned }) => {
            setMessages(prev =>
                [...prev.map(m => m._id === messageId ? { ...m, isPinned } : m)]
                    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
            );
        });

        return () => {
            socket.emit('leave-forum', eventId);
            socket.disconnect();
        };
    }, [eventId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketRef.current || sending) return;
        setSending(true);
        socketRef.current.emit('send-message', { eventId, content: newMessage.trim() });
        setNewMessage('');
        setSending(false);
    };

    const handleDelete = async (messageId) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            await api.delete(`/forum/messages/${messageId}`);
        } catch (err) {
            alert('Failed to delete message');
        }
    };

    const handlePin = async (messageId) => {
        try {
            await api.put(`/forum/messages/${messageId}/pin`);
        } catch (err) {
            alert('Failed to pin/unpin message');
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) +
            ' · ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginTop: '30px'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #6B46C1, #553C9A)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>💬</span>
                    <span style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>Event Discussion</span>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    padding: '6px 12px',
                    borderRadius: '20px'
                }}>
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: connected ? '#4ADE80' : '#F87171'
                    }} />
                    <span style={{ color: 'white', fontSize: '13px' }}>
                        {connected ? 'Live' : 'Connecting...'}
                    </span>
                </div>
            </div>

            {/* Messages area */}
            <div style={{
                height: '420px',
                overflowY: 'auto',
                padding: '16px',
                backgroundColor: '#F9FAFB',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', paddingTop: '40px' }}>
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', paddingTop: '40px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
                        <p>No messages yet. Be the first to start the discussion!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg._id}
                            msg={msg}
                            isOrganizer={isOrganizer}
                            formatTime={formatTime}
                            onDelete={handleDelete}
                            onPin={handlePin}
                        />
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSend} style={{
                padding: '16px',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                gap: '10px',
                backgroundColor: 'white'
            }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write a message..."
                    maxLength={1000}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '24px',
                        border: '2px solid #E5E7EB',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6B46C1'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || !connected}
                    style={{
                        padding: '12px 20px',
                        backgroundColor: newMessage.trim() && connected ? '#6B46C1' : '#D1D5DB',
                        color: 'white',
                        border: 'none',
                        borderRadius: '24px',
                        cursor: newMessage.trim() && connected ? 'pointer' : 'not-allowed',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'background-color 0.2s',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Send ↗
                </button>
            </form>
        </div>
    );
};

// Individual message bubble component
const MessageBubble = ({ msg, isOrganizer, formatTime, onDelete, onPin }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                backgroundColor: msg.isPinned ? '#FEF3C7' : 'white',
                borderRadius: '12px',
                padding: '12px 16px',
                border: msg.isPinned ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                transition: 'box-shadow 0.2s',
                boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                position: 'relative'
            }}
        >
            {/* Pinned banner */}
            {msg.isPinned && (
                <div style={{
                    fontSize: '11px', fontWeight: '700', color: '#D97706',
                    marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                    📌 Pinned by Organizer
                </div>
            )}

            {/* Message header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: msg.senderRole === 'organizer' ? '#6B46C1' : '#E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '700',
                    color: msg.senderRole === 'organizer' ? 'white' : '#4B5563'
                }}>
                    {msg.senderName?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                    <span style={{
                        fontSize: '13px', fontWeight: '700',
                        color: msg.senderRole === 'organizer' ? '#6B46C1' : '#1F2937'
                    }}>
                        {msg.senderName}
                    </span>
                    {msg.senderRole === 'organizer' && (
                        <span style={{
                            marginLeft: '6px', fontSize: '10px', fontWeight: '700',
                            backgroundColor: '#EDE9FE', color: '#6B46C1',
                            padding: '1px 6px', borderRadius: '10px'
                        }}>
                            ORGANIZER
                        </span>
                    )}
                </div>
                <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: 'auto' }}>
                    {formatTime(msg.createdAt)}
                </span>

                {/* Organizer moderation controls */}
                {isOrganizer && (
                    <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                        <button
                            onClick={() => onPin(msg._id)}
                            title={msg.isPinned ? 'Unpin' : 'Pin'}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '14px', opacity: 0.7, padding: '2px 6px',
                                borderRadius: '6px', backgroundColor: '#F3F4F6'
                            }}
                        >
                            {msg.isPinned ? '📌' : '📍'}
                        </button>
                        <button
                            onClick={() => onDelete(msg._id)}
                            title="Delete"
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '14px', opacity: 0.7, padding: '2px 6px',
                                borderRadius: '6px', backgroundColor: '#FEE2E2'
                            }}
                        >
                            🗑️
                        </button>
                    </div>
                )}
            </div>

            {/* Message content */}
            <p style={{
                margin: '0 0 0 40px',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#1F2937',
                wordBreak: 'break-word'
            }}>
                {msg.content}
            </p>
        </div>
    );
};

export default EventForum;
