import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrganizerNavbar from '../components/OrganizerNavbar';
import api from '../utils/api';

const OrganizerQRScanner = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [scanState, setScanState] = useState('idle'); // 'idle' | 'starting' | 'scanning' | 'result'
    const [result, setResult] = useState(null);
    const [stats, setStats] = useState({ total: 0, scanned: 0 });
    const [eventName, setEventName] = useState('');
    const [cameraError, setCameraError] = useState('');
    const html5QrRef = useRef(null);

    useEffect(() => {
        fetchStats();
        api.get(`/events/${id}`).then(r => setEventName(r.data.eventName)).catch(() => { });
        return () => { stopScanner(); };
    }, [id]);

    const fetchStats = async () => {
        try {
            const res = await api.get(`/events/${id}/attendance`);
            setStats({ total: res.data.total, scanned: res.data.scanned });
        } catch (err) {
            console.error('Stats error:', err);
        }
    };

    // This effect starts the scanner after the div is rendered in the DOM
    useEffect(() => {
        if (scanState === 'starting') {
            initScanner();
        }
    }, [scanState]);

    const initScanner = async () => {
        setCameraError('');
        const el = document.getElementById('qr-reader');
        if (!el) {
            setCameraError('Scanner element not found. Please try again.');
            setScanState('idle');
            return;
        }

        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const qr = new Html5Qrcode('qr-reader');
            html5QrRef.current = qr;

            await qr.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText) => {
                    const ticketId = decodedText.trim();
                    await handleScan(ticketId, qr);
                },
                () => { } // ignore per-frame decode failures
            );
            setScanState('scanning');
        } catch (err) {
            console.error('Camera error:', err);
            setCameraError(`Camera error: ${err.message || 'Could not access camera. Please allow camera permission.'}`);
            setScanState('idle');
        }
    };

    const stopScanner = async () => {
        if (html5QrRef.current) {
            try { await html5QrRef.current.stop(); } catch { }
            try { html5QrRef.current.clear(); } catch { }
            html5QrRef.current = null;
        }
    };

    const handleScan = async (ticketId, qrInstance) => {
        // Stop scanner before showing result
        if (qrInstance) {
            try { await qrInstance.stop(); } catch { }
        }
        html5QrRef.current = null;
        setScanState('result');

        try {
            const res = await api.post(`/events/${id}/scan`, { ticketId });
            setResult({ success: true, message: res.data.message, participant: res.data.participant, ticketId });
            fetchStats();
        } catch (err) {
            const d = err.response?.data;
            setResult({
                success: false,
                message: d?.message || 'Scan failed',
                participant: d?.participant,
                scannedAt: d?.scannedAt
            });
        }
    };

    const startCamera = () => {
        setResult(null);
        setScanState('starting'); // triggers useEffect which calls initScanner after render
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
            <OrganizerNavbar />
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '30px 20px' }}>
                <button onClick={() => { stopScanner(); navigate(`/organizer/events/${id}`); }} style={{
                    padding: '8px 16px', backgroundColor: 'white', color: '#6B46C1',
                    border: '1px solid #6B46C1', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: '600', marginBottom: '20px'
                }}>
                    ← Back to Event
                </button>

                <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '700', color: '#1F2937' }}>QR Scanner</h1>
                <p style={{ margin: '0 0 24px', color: '#6B7280', fontSize: '15px' }}>{eventName}</p>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    {[
                        { label: 'Scanned', value: stats.scanned, color: '#10B981' },
                        { label: 'Total', value: stats.total, color: '#6B46C1' },
                        { label: 'Remaining', value: stats.total - stats.scanned, color: '#F59E0B' }
                    ].map(s => (
                        <div key={s.label} style={{ flex: 1, padding: '16px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</p>
                            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: s.color }}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Scanner card */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>

                    {/* ALWAYS render #qr-reader div — only visible when camera is active */}
                    <div
                        id="qr-reader"
                        style={{ width: '100%', display: (scanState === 'starting' || scanState === 'scanning') ? 'block' : 'none' }}
                    />

                    {(scanState === 'starting' || scanState === 'scanning') && (
                        <button onClick={async () => { await stopScanner(); setScanState('idle'); }} style={{
                            marginTop: '16px', width: '100%', padding: '12px',
                            backgroundColor: '#DC2626', color: 'white', border: 'none',
                            borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 600
                        }}>
                            {scanState === 'starting' ? 'Initialising camera...' : 'Stop Scanner'}
                        </button>
                    )}

                    {scanState === 'idle' && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📷</div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#1F2937' }}>Ready to Scan</h3>
                            <p style={{ margin: '0 0 8px', color: '#6B7280', fontSize: '14px' }}>
                                Point camera at participant's QR code to mark attendance
                            </p>
                            {cameraError && (
                                <p style={{ margin: '0 0 16px', color: '#DC2626', fontSize: '13px', backgroundColor: '#FEE2E2', padding: '8px 12px', borderRadius: '6px' }}>
                                    {cameraError}
                                </p>
                            )}
                            <button onClick={startCamera} style={{
                                padding: '14px 32px', backgroundColor: '#6B46C1', color: 'white',
                                border: 'none', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '16px', fontWeight: 600
                            }}>
                                Start Camera
                            </button>
                        </div>
                    )}

                    {scanState === 'result' && result && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                                {result.success ? '✅' : '❌'}
                            </div>
                            <h2 style={{
                                margin: '0 0 8px', fontSize: '20px', fontWeight: '700',
                                color: result.success ? '#10B981' : '#DC2626'
                            }}>
                                {result.success ? 'Entry Granted!' : 'Scan Failed'}
                            </h2>
                            <p style={{ margin: '0 0 6px', color: '#1F2937', fontSize: '16px', fontWeight: 600 }}>
                                {result.participant || '—'}
                            </p>
                            <p style={{ margin: '0 0 24px', color: '#6B7280', fontSize: '14px' }}>
                                {result.message}
                                {result.scannedAt && ` (Previously at ${new Date(result.scannedAt).toLocaleTimeString()})`}
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button onClick={startCamera} style={{
                                    padding: '12px 24px', backgroundColor: '#6B46C1', color: 'white',
                                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 600
                                }}>
                                    Scan Next
                                </button>
                                <button onClick={() => setScanState('idle')} style={{
                                    padding: '12px 24px', backgroundColor: 'white', color: '#6B7280',
                                    border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '15px'
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerQRScanner;
