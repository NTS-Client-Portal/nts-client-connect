import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, useSupabaseClient } from '@/lib/supabase/provider';
import Layout from '../components/Layout';
import UserLayout from '../components/UserLayout';
import CustomSignInForm from '@/components/CustomSignInForm';
import AnimatedWelcome from '@/components/AnimatedWelcome';
import { 
    ArrowRight, 
    Shield, 
    Truck, 
    Users,
    CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
    const session = useSession();
    const supabase = useSupabaseClient();
    const router = useRouter();
    const [userName, setUserName] = useState<string>('there');
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        const checkUserRole = async () => {
            if (session) {
                // Fetch user profile for name
                const { data: userProfile, error } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, team_role')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching user profile:', error.message);
                    return;
                }

                // Set the user name for the welcome screen
                if (userProfile?.first_name) {
                    setUserName(userProfile.first_name);
                }

                // Show welcome animation
                setShowWelcome(true);

                // Redirect after animation (or immediately if skipped)
                setTimeout(() => {
                    router.push('/user');
                }, 2500); // 2.5 seconds matches the progress bar animation
            }
        };

        checkUserRole();
    }, [session?.user?.id, supabase, router]); // Only depend on user ID

    // If user is not logged in, show login page
    if (!session) {
        return (
            <>
            <Head>
            <title>Sign In - NTS Logistics</title>
            <meta name="description" content="Sign in to your NTS Logistics account" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/hc-28.png" />
        </Head><div className="min-h-screen bg-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
                    <div className="flex items-center justify-center p-8 lg:p-12">
                        <div className="w-full max-w-md">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="mx-auto h-16 w-16 bg-blue-700 rounded-lg flex items-center justify-center shadow-md mb-4">
                                    <Truck className="h-10 w-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
                                <p className="text-slate-600 font-medium">Sign in to your account</p>
                            </div>

                            {/* Sign In Form Card */}
                            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
                                <CustomSignInForm />
                            </div>

                            {/* Footer Links */}
                            <div className="mt-6 space-y-4 text-center">
                                <div className="text-slate-600">
                                    Don't have an account?{' '}
                                    <Link href="/signup" className="text-blue-700 hover:text-blue-800 font-semibold transition-colors duration-200">
                                        Sign up here
                                    </Link>
                                </div>

                                <div className="pt-3 border-t border-slate-200">
                                    <Link href="/forgot-password" className="text-slate-600 hover:text-slate-800 text-sm transition-colors duration-200">
                                        Forgot your password?
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Left Side - Branding */}
                    <div className="relative bg-blue-700 flex flex-col justify-center p-8 lg:p-12 text-white">
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="p-3 bg-white/20 rounded-lg">
                                <Truck className="h-10 w-10" />
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-bold">NTS LOGISTICS</h1>
                        </div>

                        {/* Main Content */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                                    Professional Freight & Logistics
                                </h2>
                                <p className="text-lg text-blue-100 leading-relaxed">
                                    Comprehensive transportation solutions for all your shipping needs nationwide.
                                </p>
                            </div>

                            {/* Key Points */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Reliable On-Time Delivery</p>
                                        <p className="text-sm text-blue-100">Your freight arrives when you need it</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        <Shield className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Fully Insured & Licensed</p>
                                        <p className="text-sm text-blue-100">Complete protection for all freight types</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">24/7 Customer Support</p>
                                        <p className="text-sm text-blue-100">Real people when you need help</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="pt-6 border-t border-blue-600">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold">150K+</div>
                                        <div className="text-sm text-blue-200">Trucks Nationwide</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">30K+</div>
                                        <div className="text-sm text-blue-200">Carriers</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}

                </div>
            </div>
            </>
        );
    }

    // Show animated welcome screen for logged-in users
    return (
        <AnimatedWelcome
            userName={userName}
            message="Preparing your dashboard"
            onComplete={() => router.push('/user/freight-rfq')}
        />
    );
}
