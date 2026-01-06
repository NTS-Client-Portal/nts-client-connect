import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@/lib/supabase/provider';
import { motion } from 'framer-motion';
import Image from 'next/image';

const withProfileCheck = (WrappedComponent: React.ComponentType) => {
    const ComponentWithProfileCheck = (props: any) => {
        const session = useSession();
        const router = useRouter();
        const [loading, setLoading] = useState(true);
        const [showLoadingScreen, setShowLoadingScreen] = useState(true);

        useEffect(() => {
            if (session) {
                // Perform profile check logic here
                setLoading(false);
            } else {
                router.push('/login');
            }
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
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };

    return ComponentWithProfileCheck;
};

export default withProfileCheck;