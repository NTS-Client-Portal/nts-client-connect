import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import Image from 'next/image';
import NotificationBell from '@/components/NotificationBell';
import FeedBack from '@/components/ui/FeedBack';
import DarkModeToggle from '@/components/ui/DarkModeToggle';
import Link from 'next/link';
import { useSession } from '@supabase/auth-helpers-react';
import Router from 'next/router';

interface UserTopNavProps {
    className?: string;
}

interface AssignedSalesUser {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
}

const UserTopNav: React.FC<UserTopNavProps> = ({ className = '' }) => {
    const { userProfile } = useProfilesUser();
    const session = useSession();
    const [darkMode, setDarkMode] = useState(false);
    const [profilePictureUrl, setProfilePictureUrl] = useState<string>('https://www.gravatar.com/avatar?d=mp&s=100');
    const [assignedSalesUsers, setAssignedSalesUsers] = useState<AssignedSalesUser[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

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

    useEffect(() => {
        const fetchAssignedSalesUsers = async () => {
            if (userProfile?.company_id) {
                const { data, error } = await supabase
                    .from('company_sales_users')
                    .select('sales_user_id, nts_users(first_name, last_name, email, phone_number)')
                    .eq('company_id', userProfile.company_id);

                if (error) {
                    console.error('Error fetching assigned sales users:', error.message);
                } else if (data) {
                    setAssignedSalesUsers(data.map((item: any) => item.nts_users));
                }
            }
        };

        fetchAssignedSalesUsers();
    }, [userProfile]);

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error logging out:', error.message);
                alert('Failed to log out. Please try again.');
            } else {
                Router.push('/'); // Redirect to login page
            }
        } catch (err) {
            console.error('Unexpected error during logout:', err);
            alert('An unexpected error occurred. Please try again.');
            Router.push('/'); // Redirect to login page
        }
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        if (!darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    return (
        <>
            <nav className={`md:hidden w-full max-h-max bg-white flex flex-col md:flex-row gap-1 justify-end px-4 z-20 py-1 drop-shadow ${className}`}>
                <div className='flex gap-6 items-center z-20 justify-between mr-4'>
                    <ul className='flex gap-2 items-center justify-end w-full'>
                        <li>
                            <NotificationBell session={session} />
                        </li>
                    </ul>
                    <ul className='relative'>
                        <li>
                            <Image
                                src={profilePictureUrl}
                                alt='profile-img'
                                className='rounded-full shadow-md cursor-pointer'
                                width={34}
                                height={34}
                                onClick={toggleDropdown}
                            />
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-fit text-xs bg-white border border-gray-200 rounded shadow-lg">
                                    <div className="p-4">
                                        <p><strong>{userProfile?.first_name} {userProfile?.last_name}</strong></p>
                                        <p>{userProfile?.email}</p>
                                        <p>{userProfile?.phone_number}</p>
                                    </div>
                                    <div className="border-t border-gray-200">
                                        <Link href="/user/settings" legacyBehavior>
                                            <a className="block px-4 py-2 text-gray-800 hover:bg-gray-100">User Settings</a>
                                        </Link>
                                        <Link href="/user/settings" legacyBehavior>
                                            <a className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Security Settings</a>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    </ul>
                </div>
                <div className='flex justify-between gap-2'>
                    <FeedBack />
                    {/* <DarkModeToggle /> */}
                    <span>
                        {assignedSalesUsers.length > 0 && (
                            <div className="flex flex-col items-start">
                                <span className="text-sm">Assigned Representative:</span>
                                {assignedSalesUsers.map((user, index) => (
                                    <div key={index} className="font-bold text-xs">
                                        {user.first_name} {user.last_name} - {user.phone_number} <br /> {user.email}
                                    </div>
                                ))}
                            </div>
                        )}
                    </span>
                </div>
            </nav>
            <nav className={`hidden w-full bg-white z-20 md:flex flex-col md:flex-row gap-1 justify-between px-4 py-2 drop-shadow ${className}`}>
                <ul className='w-full flex gap-2 md:gap-4 items-center z-20 justify-start pl-64'>
                    <li>
                        <FeedBack />
                    </li>
                    {/* <li>
                        <DarkModeToggle />
                    </li> */}
                </ul>
                <ul className='w-full flex gap-2 md:gap-4 items-start z-20 justify-end mr-12'>
                    <li>
                        {assignedSalesUsers.length > 0 && (
                            <div className="flex flex-col items-start">
                                <span className="text-sm">Assigned Sales User:</span>
                                {assignedSalesUsers.map((user, index) => (
                                    <div key={index} className="font-bold text-sm">
                                        {user.first_name} {user.last_name} - ({user.phone_number}) <br /> {user.email}
                                    </div>
                                ))}
                            </div>
                        )}
                    </li>
                    <li>
                        <NotificationBell session={session} />
                    </li>
                    <li className='relative'>
                        <Image
                            src={profilePictureUrl}
                            alt='profile-img'
                            className='rounded-full shadow-md cursor-pointer'
                            width={34}
                            height={34}
                            onClick={toggleDropdown}
                        />
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-fit text-sm bg-white border border-gray-200 rounded shadow-lg">
                                <div className="p-4">
                                    <p><strong>{userProfile?.first_name} {userProfile?.last_name}</strong></p>
                                    <p>{userProfile?.email}</p>
                                    <p>{userProfile?.phone_number}</p>
                                </div>
                                <div className="border-t border-gray-200">
                                    <Link href="/user/settings" legacyBehavior>
                                        <a className="block px-4 py-2 text-gray-800 hover:bg-gray-100">User Settings</a>
                                    </Link>
                                    <Link href="/user/settings" legacyBehavior>
                                        <a className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Security Settings</a>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                </ul>
            </nav>
        </>
    );
};

export default UserTopNav;