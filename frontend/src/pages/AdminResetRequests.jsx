import { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import api from '../utils/api';

const statusColors = {
    Pending: { bg: '#FEF3C7', color: '#92400E' },
    Approved: { bg: '#D1FAE5', color: '#065F46' },
    Rejected: { bg: '#FEE2E2', color: '#991B1B' }
};

const AdminResetRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectComment, setRejectComment] = useState({});
    const [revealedPasswords, setRevealedPasswords] = useState({});

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/admin/reset-requests');
            setRequests(res.data.requests || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const res = await api.put(`/admin/reset-requests/${id}/approve`);
            setRevealedPasswords(prev => ({ ...prev, [id]: res.data.newPassword }));
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = async (id) => {
        try {
            await api.put(`/admin/reset-requests/${id}/reject`, { comment: rejectComment[id] || '' });
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject');
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
            <AdminNavbar />
            <div style={{ padding: '30px 50px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#1F2937' }}>
                    Password Reset Requests
                </h1>
                <p style={{ margin: '0 0 30px 0', fontSize: '15px', color: '#6B7280' }}>
                    Review and process organizer password reset requests
                </p>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>Loading...</div>
                ) : requests.length === 0 ? (
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#6B7280', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        No password reset requests yet.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {requests.map(req => {
                            const orgId = req.organizerId?._id || req.organizerId;
                            const sc = statusColors[req.status] || statusColors.Pending;
                            return (
                                <div key={req._id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
                                                    {req.organizerId?.organizerName || 'Unknown'}
                                                </h3>
                                                <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: sc.bg, color: sc.color }}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6B7280' }}>
                                                {req.organizerId?.contactEmail} • {req.organizerId?.category}
                                            </p>
                                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
                                                <strong>Reason:</strong> {req.reason}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
                                                Submitted: {new Date(req.createdAt).toLocaleString()}
                                            </p>
                                            {req.adminComment && (
                                                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
                                                    <strong>Admin comment:</strong> {req.adminComment}
                                                </p>
                                            )}
                                            {revealedPasswords[req._id] && (
                                                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#D1FAE5', borderRadius: '8px', border: '1px solid #6EE7B7' }}>
                                                    <p style={{ margin: 0, fontSize: '14px', color: '#065F46', fontWeight: '600' }}>
                                                        ✅ New Password (share with organizer manually):
                                                    </p>
                                                    <code style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '1px' }}>{revealedPasswords[req._id]}</code>
                                                </div>
                                            )}
                                            {req.status === 'Approved' && req.newPassword && !revealedPasswords[req._id] && (
                                                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#065F46' }}>
                                                    ✅ Password was reset and shared with organizer.
                                                </p>
                                            )}
                                        </div>

                                        {req.status === 'Pending' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                                                <button
                                                    onClick={() => handleApprove(req._id)}
                                                    style={{ padding: '10px 20px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                                                >
                                                    ✅ Approve & Generate Password
                                                </button>
                                                <textarea
                                                    placeholder="Rejection reason (optional)"
                                                    value={rejectComment[req._id] || ''}
                                                    onChange={e => setRejectComment(prev => ({ ...prev, [req._id]: e.target.value }))}
                                                    rows={2}
                                                    style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', resize: 'none' }}
                                                />
                                                <button
                                                    onClick={() => handleReject(req._id)}
                                                    style={{ padding: '10px 20px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                                                >
                                                    ❌ Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminResetRequests;
