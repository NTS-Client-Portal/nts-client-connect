import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@supabase/auth-helpers-react';
import { isProfileComplete } from '@/lib/isProfileComplete';
import { NextComponentType, NextPageContext } from 'next';
import { supabase } from '@/lib/initSupabase'; // Adjust the import path as needed
import { motion } from 'framer-motion';

const withProfileCheck = (WrappedComponent: NextComponentType<NextPageContext, any, any>) => {
    const ComponentWithProfileCheck = (props: any) => {
        const router = useRouter();
        const session = useSession();
        const [loading, setLoading] = useState(true);
        const [showLoadingScreen, setShowLoadingScreen] = useState(false);

        useEffect(() => {
            const checkProfile = async () => {
                if (session?.user?.id) {
                    console.log('Session user ID:', session.user.id);

                    // Check if the user exists in the profiles table
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('id', session.user.id)
                        .single();

                    if (profileError) {
                        console.error('Error fetching profile:', profileError);
                        setLoading(false);
                        return;
                    }

                    if (profile) {
                        // User exists in the profiles table, check if the profile is complete
                        const profileComplete = await isProfileComplete(session.user.id);
                        if (!profileComplete && router.pathname !== '/profile-setup') {
                            console.log('Profile incomplete, redirecting to profile setup');
                            router.push('/profile-setup');
                        } else {
                            setLoading(false);
                        }
                    } else {
                        // User does not exist in the profiles table, no need for profile setup
                        setLoading(false);
                    }
                } else {
                    setLoading(false);
                }
            };

            const timer = setTimeout(() => {
                setShowLoadingScreen(true);
            }, 2000); // Show loading screen after 2 seconds

            checkProfile().finally(() => {
                clearTimeout(timer);
                setLoading(false);
            });

            return () => clearTimeout(timer);
        }, [session, router]);

        if (loading && showLoadingScreen) {
            return (
                <div className="flex flex-col items-center justify-center h-screen">
                    <motion.div
                        className="w-1/2 h-1 bg-blue-500"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
                    />
                    <img src="/path/to/company-logo.png" alt="Company Logo" className="mt-4 w-32 h-32" />
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };

    return ComponentWithProfileCheck;
};

export default withProfileCheck;