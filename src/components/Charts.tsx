import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';

interface Chart {
    id: string;
    symbol: string;
    image_url: string;
    notes?: string;
    created_at: string;
    uploaded_by: string;
}

interface UserProfile {
    id: string;
    role: string;
}

function ChartsContent() {
    const { user, session, loading: authLoading } = useAuth();
    const [charts, setCharts] = useState<Chart[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);

    const [chartFile, setChartFile] = useState<File | null>(null);
    const [chartSymbol, setChartSymbol] = useState('');
    const [chartNotes, setChartNotes] = useState('');

    useEffect(() => {
        if (user && session) {
            checkAdminStatus();
            fetchCharts();
        } else {
            setLoading(false);
        }
    }, [user, session]);

    const checkAdminStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user?.id)
                .maybeSingle();

            if (error) throw error;
            setIsAdmin(data?.role === 'admin');
        } catch (err) {
            console.error('Error checking admin status:', err);
        }
    };

    const fetchCharts = async () => {
        try {
            const { data, error } = await supabase
                .from('charts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCharts(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load charts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!chartFile) {
            setError('Please select a chart image');
            return;
        }

        if (!chartSymbol.trim()) {
            setError('Please enter a symbol');
            return;
        }

        if (!isAdmin) {
            setError('Only admins can upload charts');
            return;
        }

        setUploadLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', chartFile);
            formData.append('symbol', chartSymbol.trim().toUpperCase());
            formData.append('notes', chartNotes.trim());

            const token = session?.access_token;
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/charts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            setChartFile(null);
            setChartSymbol('');
            setChartNotes('');
            await fetchCharts();
        } catch (err: any) {
            setError(err.message || 'Failed to upload chart');
            console.error(err);
        } finally {
            setUploadLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-lg opacity-70">Loading charts...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <div className="p-8 text-center rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-2xl font-bold mb-3">Sign In Required</h3>
                        <p className="text-lg opacity-90 mb-6">
                            View technical analysis charts shared by our team.
                        </p>
                        <p className="text-sm opacity-70 mb-6">
                            Sign in to access chart library and market analysis.
                        </p>
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded font-medium"
                        >
                            Sign In to View Charts
                        </button>
                    </div>
                </div>
                <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            </>
        );
    }

    return (
        <>
            {isAdmin && (
                <section className="mb-12">
                    <div className="p-6 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <h3 className="text-lg font-semibold mb-4">Upload Chart (Admin Only)</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Chart Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setChartFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Symbol</label>
                                <input
                                    type="text"
                                    value={chartSymbol}
                                    onChange={(e) => setChartSymbol(e.target.value)}
                                    placeholder="e.g., AAPL, TSLA"
                                    className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Notes</label>
                                <textarea
                                    value={chartNotes}
                                    onChange={(e) => setChartNotes(e.target.value)}
                                    placeholder="Add analysis notes..."
                                    rows={3}
                                    className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            {error && (
                                <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                                    {error}
                                </div>
                            )}
                            <button
                                onClick={handleUpload}
                                disabled={uploadLoading}
                                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploadLoading ? 'Uploading...' : 'Upload Chart'}
                            </button>
                        </div>
                    </div>
                </section>
            )}

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Recent Charts</h2>
                {charts.length === 0 ? (
                    <div className="p-6 rounded-lg bg-gray-800/40 border border-gray-700 text-center opacity-70">
                        <p>No charts available yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {charts.map((chart) => (
                            <div
                                key={chart.id}
                                className="p-6 rounded-lg bg-gray-800/40 border border-gray-700 hover:border-primary/50 transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-xl font-bold text-white">{chart.symbol}</span>
                                    <span className="text-sm opacity-60">{formatDate(chart.created_at)}</span>
                                </div>
                                <div className="mb-3">
                                    <img
                                        src={chart.image_url}
                                        alt={`${chart.symbol} chart`}
                                        className="w-full rounded border border-gray-700"
                                    />
                                </div>
                                {chart.notes && (
                                    <p className="text-sm opacity-80 leading-relaxed">{chart.notes}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}

export default function Charts() {
    return (
        <AuthProvider>
            <ChartsContent />
        </AuthProvider>
    );
}
