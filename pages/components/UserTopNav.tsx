import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import Image from 'next/image';
import NotificationBell from '@/components/NotificationBell';
import FeedBack from '@/components/ui/FeedBack';
import Link from 'next/link';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';

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
                    .select(`
                        sales_user_id,
                        nts_users (
                            first_name,
                            last_name,
                            email,
                            phone_number
                        )
                    `)
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

    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        sessionStorage.clear();
        localStorage.clear();
        router.push('/');
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    return (
        <>
            <nav className={`md:hidden w-full max-h-max bg-white py-1 drop-shadow ${className}`}>
                <div className='flex justify-end gap-6 pr-3 w-full'>

                    <span>
                        <NotificationBell session={session} />
                    </span>

                    <span>
                        <Image
                            src={profilePictureUrl}
                            alt='profile-img'
                            className='rounded-full shadow-lg cursor-pointer '
                            width={44}
                            height={44}
                            onClick={toggleDropdown}
                        />
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-1 md:mt-2 z-50 w-fit text-sm bg-white border border-gray-200 rounded shadow-lg">
                                <div className="p-4">
                                    <span className="text-sm">Assigned Representative:</span>
                                    {assignedSalesUsers.map((user, index) => (
                                        <div key={index} className="font-bold text-xs">
                                            {user.first_name} {user.last_name} - {user.phone_number} <br /> {user.email}
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200">
                                    <Link href="/user/settings" className="block px-2 py-2 border-b border-gray-200 font-semibold text-gray-800 hover:bg-gray-100">
                                        User Settings
                                    </Link>
                                    <Link href="/user/settings" className="block px-2 py-2 border-b border-gray-200 font-semibold text-gray-800 hover:bg-gray-100">
                                        Security Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left font-semibold px-2 border-b border-gray-200 py-2 text-gray-800 hover:bg-gray-100"
                                    >
                                        Logout
                                    </button>
                                    <span className='flex justify-center items-center my-2'> <FeedBack /></span>
                                </div>
                            </div>
                        )}
                    </span>

                </div>
            </nav>
            <nav className={`hidden w-full bg-white z-10 md:flex flex-col md:flex-row gap-1 justify-between px-4 py-2 drop-shadow ${className}`}>
                <ul className='w-full flex md:gap-12 items-center z-20 justify-start pl-64'>
                    <li>
                        <FeedBack />
                    </li>

                </ul>
                <ul className='w-full flex gap-12 items-center z-20 justify-end mr-12'>
                    <li>
                        <NotificationBell session={session} />
                    </li>
                    <li className='relative right-0 z-50'>
                        <Image
                            src={profilePictureUrl}
                            alt='profile-img'
                            className='rounded-full shadow-md cursor-pointer '
                            width={40}
                            height={40}
                            onClick={toggleDropdown}
                            priority
                        />
                        {dropdownOpen && (
                            <div className="absolute z-auto right-0 mt-2 w-fit text-sm bg-white border border-gray-200 rounded shadow-lg">
                                <div className="p-4">
                                    <span className="text-sm font-bold">Assigned Representative:</span>
                                    {assignedSalesUsers.map((user, index) => (
                                        <div key={index} className="font-medium text-sm">
                                            {user.first_name} {user.last_name} - ({user.phone_number}) <br /> {user.email}
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200">
                                    <Link href="/user/settings" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                                        User Settings
                                    </Link>
                                    <Link href="/user/settings" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                                        Security Settings
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