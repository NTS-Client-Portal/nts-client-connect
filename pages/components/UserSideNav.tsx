import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import Image from 'next/image';
import { PanelLeftOpen, PanelRightClose, Workflow, Folders, NotebookTabs, Settings } from 'lucide-react';

interface UserSideNavProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    className?: string;
}

const UserSideNav: React.FC<UserSideNavProps> = ({ isSidebarOpen, toggleSidebar, className = '' }) => {
    const supabase = useSupabaseClient<Database>();
    const { userProfile } = useProfilesUser();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error logging out:', error.message);
                alert('Failed to log out. Please try again.');
            } else {
                router.push('/'); // Redirect to login page
            }
        } catch (err) {
            console.error('Unexpected error during logout:', err);
            alert('An unexpected error occurred. Please try again.');
            router.push('/'); // Redirect to login page
        }
    };

    const profilePictureUrl = userProfile?.profile_picture
        ? supabase.storage.from('profile-pictures').getPublicUrl(userProfile.profile_picture).data.publicUrl
        : 'https://www.gravatar.com/avatar?d=mp&s=100';

    return (
        <>
            <div>
                <div className="xl:hidden">
                    <button
                        className="fixed z-50 top-1 left-0 p-2 drop-shadow-lg rounded-full"
                        onClick={toggleSidebar}
                    >
                        {isSidebarOpen ? <PanelRightClose size={24} className='text-white z-50 drop-shadow-lg' /> : <PanelLeftOpen size={28} className='z-50 text-zinc-900 drop-shadow-lg ' />}
                    </button>
                </div>
                <nav className={`side-navbar z-50 flex flex-col h-screen py-6 drop-shadow absolute top-0 left-0 transform ${isSidebarOpen ? 'translate-x-0 z-50' : '-translate-x-full'} transition-transform duration-300 h-screen ease-in-out z-50 ${className}`}>
                    <div className='flex mt-5 lg:mt-2 2xl:mt-0 mb-3 items-center justify-center font-bold flex-nowrap'>
                        <Image
                            src="/nts-logo.png"
                            alt="NTS Logo"
                            width={150}
                            height={50}
                            className="object-contain"
                        />
                    </div>
                    <span className="w-full flex flex-col items-center gap-1 justify-center mb-6 border-b border-stone-100/40 pb-4">
                        <h3 className='font-semibold'>Welcome {userProfile?.first_name || 'User'}</h3>
                    </span>
                    <ul className='flex flex-col flex-grow overflow-y-auto'>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user' || router.pathname === '/' ? "active" : ""}`}>
                            <Link href="/user" legacyBehavior>
                                <a className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user' || router.pathname === '/' ? "active" : ""}`}>
                                    <span className='flex items-center flex-nowrap justify-normal gap-2 py-2 pl-3'><Workflow size={'20px'} /> <span className='text-xs md:text-sm '>Logistics RFQ </span></span>
                                </a>
                            </Link>
                        </li>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user/inventory' ? "active" : ""}`}>
                            <Link href="/user/inventory" legacyBehavior>
                                <a className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/inventory' ? "active" : ""}`}>
                                    <span className='w-full flex items-center flex-nowrap justify-normal gap-2 py-2 pl-3'><NotebookTabs size={'20px'} /> <span className='text-xs md:text-sm'>Inventory </span></span>
                                </a>
                            </Link>
                        </li>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user/documents' ? "active" : ""}`}>
                            <Link href="/user/documents" legacyBehavior>
                                <a className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/documents' ? "active" : ""}`}>
                                    <span className='flex items-center flex-nowrap justify-normal gap-2 py-2 pl-3'><Folders size={'20px'} /> <span className='text-xs md:text-sm '>Documents/Pictures</span></span>
                                </a>
                            </Link>
                        </li>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user/equipment-directory' ? "active" : ""}`}>
                            <Link href="/user/equipment-directory" legacyBehavior>
                                <a className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/equipment-directory' ? "active" : ""}`}>
                                    <span className='w-full flex items-center flex-nowrap justify-normal gap-2 py-2 pl-3'><NotebookTabs size={'20px'} /> <span className='text-xs md:text-sm'>Equipment Directory </span></span>
                                </a>
                            </Link>
                        </li>
                    </ul>
                    <ul className='flex flex-col gap-4 justify-end items-center'>
                        <li className={`w-full text-nowrap flex justify-normal m-0 ${router.pathname === '/user/settings' ? "active" : ""}`}>
                            <Link href="/user/settings" legacyBehavior>
                                <span className={`logout mt-4 md:mt-0 dark:bg-zinc-300 dark:text-zinc-700 flex items-center justify-center gap-2 font-semibold py-1 w-full ${router.pathname === '/user/settings' ? "active" : ""}`}>
                                    <Settings />   Settings
                                </span>
                            </Link>
                        </li>
                        <li className="w-full flex items-center justify-center m-0">
                            <button className="logout dark:bg-zinc-300 dark:text-zinc-700 font-semibold py-1 w-full" onClick={handleLogout}>
                                Logout
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </>
    );
};

export default UserSideNav;