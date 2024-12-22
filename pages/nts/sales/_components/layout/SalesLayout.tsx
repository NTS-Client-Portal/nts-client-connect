import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useNtsUsers } from '@/context/NtsUsersContext';
import Image from 'next/image';
import NotificationBell from '@/components/NotificationBell';
import { Session } from '@supabase/auth-helpers-react';
import FeedBack from '@/components/ui/FeedBack';

interface SalesTopNavProps {
    className?: string;
}

const SalesTopNav: React.FC<SalesTopNavProps> = ({ className = '' }) => {
    const { userProfile } = useNtsUsers();
    const [profilePictureUrl, setProfilePictureUrl] = useState<string>('https://www.gravatar.com/avatar?d=mp&s=100');

    useEffect(() => {
        if (userProfile?.profile_picture) {
            const profilePicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}${userProfile.profile_picture}`;
            setProfilePictureUrl(profilePicUrl);
        }
    }, [userProfile]);

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error logging out:', error.message);
                alert('Failed to log out. Please try again.');
            }
            window.location.href = '/login'; // Redirect to login page
        } catch (err) {
            console.error('Unexpected error during logout:', err);
            alert('An unexpected error occurred. Please try again.');
            window.location.href = '/login'; // Redirect to login page
        }
    };

    return (
        <>
            <nav className={`md:hidden w-full max-h-max absolute top-0 bg-white dark:bg-zinc-700 flex flex-col md:flex-row gap-1 justify-end px-4 z-50 py-1 drop-shadow ${className}`}>
                <ul className='flex gap-2 md:gap-4 items-center z-50 justify-end mr-4'>
                    <li>
                        <NotificationBell session={null} />
                    </li>
                    <li className='hidden md:block'>
                        <FeedBack />
                    </li>
                    <li>
                        <Image
                            src={profilePictureUrl}
                            alt='profile-img'
                            className='rounded-full shadow-md'
                            width={34}
                            height={34}
                            fetchPriority="low" // Use camelCase
                        />
                    </li>
                </ul>
                <FeedBack />
            </nav>

            <nav className={`hidden w-full bg-white absolute top-0 md:flex flex-col md:flex-row gap-1 justify-between px-4 z-50 py-2 drop-shadow ${className}`}>
                <ul className='w-full flex gap-2 md:gap-4 items-center z-50 justify-start pl-64'>
                    <li>
                        <FeedBack />
                    </li>
                </ul>
                <ul className='w-full flex gap-2 md:gap-4 items-center z-50 justify-end mr-12'>
                    <li>
                        <NotificationBell session={null} />
                    </li>
                    <li>
                        <Image
                            src={profilePictureUrl}
                            alt='profile-img'
                            className='rounded-full shadow-md'
                            width={34}
                            height={34}
                            fetchPriority="high" // Use camelCase
                        />
                    </li>
                </ul>
            </nav>
        </>
    );
};

export default SalesTopNav;