import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useNtsUsers } from '@/context/NtsUsersContext';
import Image from 'next/image';
import NotificationBell from '@/components/NotificationBell';
import { Session } from '@supabase/auth-helpers-react';
import FeedBack from '@/components/ui/FeedBack';
import { useRouter } from 'next/router';

interface SalesTopNavProps {
    session: Session | null;
    className?: string;
}

const SalesTopNav: React.FC<SalesTopNavProps> = ({ session, className = '' }) => {
    const { userProfile } = useNtsUsers();
    const [darkMode, setDarkMode] = useState(false);
    const [profilePictureUrl, setProfilePictureUrl] = useState<string>('https://www.gravatar.com/avatar?d=mp&s=100');

    useEffect(() => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
        if (savedDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        if (userProfile?.profile_picture) {
            const profilePicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}${userProfile.profile_picture}`;
            setProfilePictureUrl(profilePicUrl);
        }
    }, [userProfile]);

   const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        sessionStorage.clear();
        localStorage.clear();
        router.push('/nts/login');
    };


    return (
        <>
            <nav className={`md:hidden w-full  max-h-max absolute top-0 bg-white dark:bg-zinc-700 flex flex-col md:flex-row gap-1 justify-end px-4 z-50 py-1 drop-shadow ${className}`}>
                <ul className='flex gap-2 md:gap-4 items-center z-50 justify-start ml-4'>
                    <li>
                        <NotificationBell session={session} />
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
                            height={34} />
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
                        <NotificationBell session={session} />
                    </li>
                    <li>
                        <Image
                            src={profilePictureUrl}
                            alt='profile-img'
                            className='rounded-full shadow-md'
                            width={34}
                            height={34}
                            fetchPriority="high" />
                    </li>
                </ul>
            </nav>
        </>
    );
};

export default SalesTopNav;