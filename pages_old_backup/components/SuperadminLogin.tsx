import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/initSupabase';
import { Eye, EyeOff, Crown, Shield, AlertCircle } from 'lucide-react';

const SuperadminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setLoading(false);
            setError('Invalid email or password');
            return;
        }

        const { data: userProfile, error: profileError } = await supabase
            .from('nts_users')
            .select('role')
            .eq('id', authData.user.id)
            .single();

        setLoading(false);

        // Check for both legacy and new super admin role formats
        const validSuperAdminRoles = ['superadmin', 'super_admin'];
        if (profileError || !userProfile?.role || !validSuperAdminRoles.includes(userProfile.role)) {
            setError('You do not have permission to access this page');
            return;
        }

        // Redirect to the superadmin dashboard
        router.push('/superdash');
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Crown className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-slate-800">
                        Super Admin Login
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Secure access to system administration
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                                <p className="text-red-700 text-sm font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-colors duration-200"
                                placeholder="Enter your admin email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-colors duration-200"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg transform hover:scale-105 transition-all duration-200"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Shield className="h-5 w-5" />
                                    <span>Sign In to Admin Panel</span>
                                </div>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                            <Shield className="h-4 w-4" />
                            <span>Restricted Access Area</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperadminLogin;