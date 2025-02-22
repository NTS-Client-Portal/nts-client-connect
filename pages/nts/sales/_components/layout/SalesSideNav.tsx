import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { useNtsUsers } from '@/context/NtsUsersContext';
import Image from 'next/image';
import { PanelLeftOpen, PanelRightClose, MessageSquareMore, ChevronRightCircle, Folders, NotebookTabs, Settings, MoveHorizontal, ChartArea } from 'lucide-react';

interface SalesSideNavProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    className?: string;
}

const SalesSideNav: React.FC<SalesSideNavProps> = ({ isSidebarOpen, toggleSidebar, className = '' }) => {
    const supabase = useSupabaseClient<Database>();
    const { userProfile } = useNtsUsers();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        sessionStorage.clear();
        localStorage.clear();
        router.push('/nts/login');
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
                        {isSidebarOpen ? <PanelRightClose size={24} className='text-white z-50 drop-shadow-lg' /> : <PanelLeftOpen size={28} className='z-50 text-zinc-900 dark:text-zinc-100 drop-shadow-lg ' />}
                    </button>
                </div>
                <nav className={`side-navbar z-50 flex flex-col h-screen py-6 drop-shadow absolute top-0 left-0 transform ${isSidebarOpen ? 'translate-x-0 z-50' : '-translate-x-full'} transition-transform duration-300 h-screen ease-in-out z-50 ${className}`}>
                    <span className='flex mt-5 lg:mt-2 2xl:mt-0 mb-3 items-center justify-center font-bold  flex-nowrap'> <h1 className='text-lg md:mt-0  self-center font-extrabold tracking-tighter flex gap-0.5'>SHIPPER<MoveHorizontal className='size-6 text-orange-500' />CONNECT</h1></span>
                    <div className="w-full flex flex-col items-center gap-1 justify-center mb-6 border-b border-stone-100/40 pb-4">
                        <h3>Welcome {userProfile?.first_name || 'User'}</h3>
                    </div>
                    <ul className='flex gap-3 flex-col flex-grow space-y-1 overflow-y-hidden'>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/nts/sales' ? "active" : ""}`}>
                            <Link href="/nts/sales" legacyBehavior>
                                <a className={`side-nav-btn text-stone-100 font-semibold py-1 w-full ${router.pathname === '/nts/sales' ? "active" : ""}`}>
                                    <span className='w-full flex items-center flex-nowrap justify-normal gap-2'><ChartArea size={'20px'} /> <span className='text-xs md:text-sm'>Shipper Profiles</span></span>
                                </a>
                            </Link>
                        </li>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/nts/sales/documents' ? "active" : ""}`}>
                            <Link href="/nts/sales/documents" legacyBehavior>
                                <a className={`side-nav-btn text-stone-100 font-semibold py-1 w-full ${router.pathname === '/nts/sales/documents' ? "active" : ""}`}>
                                    <span className='w-full flex items-center flex-nowrap justify-normal gap-2'><Folders size={'20px'} /> <span className='text-xs md:text-sm'>Documents/Photos</span></span>
                                </a>
                            </Link>
                        </li>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/nts/sales/chat-requests' ? "active" : ""}`}>
                            <Link href="/nts/sales/chat-requests" legacyBehavior>
                                <a className={`side-nav-btn text-stone-100 font-semibold py-1 w-full ${router.pathname === '/nts/sales/chat-requests' ? "active" : ""}`}>
                                    <span className='w-full flex items-center text-sm flex-nowrap text-nowrap justify-normal gap-1'><MessageSquareMore size={'20px'} />Shipper Connect</span>
                                </a>
                            </Link>
                        </li>
                        {/* <li className={`w-full flex justify-normal m-0 ${router.pathname === '/nts/sales/central-connect' ? "active" : ""}`}>
                            <Link href="/nts/sales/central-connect" legacyBehavior>
                                <a className={`side-nav-btn text-stone-100 font-semibold py-1 w-full ${router.pathname === '/nts/sales/central-connect' ? "active" : ""}`}>
                                    <span className='w-full flex items-center text-sm flex-nowrap text-nowrap justify-normal gap-1'><ChevronRightCircle size={'20px'} />CD Connect</span>
                                </a>
                            </Link>
                        </li> */}
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/nts/sales/equipment-directory' ? "active" : ""}`}>
                            <Link href="/nts/sales/equipment-directory" legacyBehavior>
                                <a className={`side-nav-btn text-stone-100 font-semibold py-1 w-full ${router.pathname === '/nts/sales/equipment-directory' ? "active" : ""}`}>
                                    <span className='w-full flex items-center flex-nowrap justify-normal gap-2'><NotebookTabs size={'20px'} /> <span className='text-xs md:text-sm'>Equipment Directory </span></span>
                                </a>
                            </Link>
                        </li>
                    </ul>
                    <ul className='flex flex-col gap-4 justify-end items-center'>
                        <li className={`w-full text-nowrap flex justify-normal m-0 ${router.pathname === '/nts/sales/settings' ? "active" : ""}`}>
                            <Link href="/nts/sales/settings" legacyBehavior>
                                <a className={`logout mt-4 md:mt-0 dark:bg-zinc-300 dark:text-zinc-700 flex items-center justify-center gap-2 font-semibold py-1 w-full ${router.pathname === '/nts/sales/settings' ? "active" : ""}`}>
                                    <Settings />   Settings
                                </a>
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

export default SalesSideNav;