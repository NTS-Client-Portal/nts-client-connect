import React from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@/lib/supabase/provider';

const Unauthorized: React.FC = () => {
    const router = useRouter();
    const supabase = useSupabaseClient();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error.message);
        } else {
            router.push('/'); // Redirect to the home or login page after logout
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <p className="mb-4">You do not have access to this page.</p>
            <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
            >
                Logout
            </button>
        </div>
    );
};

export default Unauthorized;