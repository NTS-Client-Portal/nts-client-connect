import React from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import { PanelLeftOpen, PanelRightClose, Workflow, Folders, NotebookTabs, Settings, MoveHorizontal, ChartArea, Signature, Hammer } from 'lucide-react';

interface SalesSideNavProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    className?: string;
    currentView: string;
    setCurrentView: (view: string) => void;
}

const SalesSideNav: React.FC<SalesSideNavProps> = ({ isSidebarOpen, toggleSidebar, className = '', currentView, setCurrentView }) => {
    const supabase = useSupabaseClient<Database>();
    const { userProfile } = useUser();
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
                <div className="md:hidden">
                    <button
                        className="fixed z-50 top-1 left-0 p-2 drop-shadow-lg rounded-full"
                        onClick={toggleSidebar}
                    >
                        {isSidebarOpen ? <PanelRightClose size={24} className='text-white z-50 drop-shadow-lg' /> : <PanelLeftOpen size={28} className='z-50 text-zinc-900 dark:text-zinc-100 drop-shadow-lg ' />}
                    </button>
                </div>
                <nav className={`side-navbar pr-2 z-50 flex flex-col h-screen py-6 drop-shadow absolute top-0 left-0 transform ${isSidebarOpen ? 'translate-x-0 z-50' : '-translate-x-full'} transition-transform duration-300 h-screen ease-in-out z-50 ${className}`}>
                    <span className='flex mt-5 lg:mt-2 2xl:mt-0 mb-3 items-center justify-center font-bold  flex-nowrap'> <h1 className='text-lg md:mt-0  self-center font-extrabold tracking-tighter flex gap-0.5'>SHIPPER<MoveHorizontal className='size-6 text-orange-500' />CONNECT</h1></span>
                    <div className="w-full flex flex-col items-center gap-1 justify-center mb-6 border-b border-stone-100/40 pb-4">
                        <h3>Welcome {userProfile?.first_name || 'User'}</h3>
                    </div>
                    <ul className='flex gap-3 flex-col flex-grow space-y-1 overflow-y-hidden'>
                        <li className={`w-full flex justify-normal m-0 ${currentView === 'quote-requests' ? "active" : ""}`}>
                            <button onClick={() => setCurrentView('salesdash')} className={`side-nav-btn text-stone-100 font-semibold py-1 w-full ${currentView === 'quote-requests' ? "active" : ""}`}>
                                <span className='flex items-center flex-nowrap justify-normal gap-2'><Workflow size={'20px'} /> <span className='text-xs md:text-sm'>Broker&apos;s Dashboard</span></span>
                            </button>
                        </li>
                        <li className={`w-full flex justify-normal m-0 ${currentView === 'documents' ? "active" : ""}`}>
                            <button onClick={() => setCurrentView('documents')} className={`side-nav-btn text-stone-100 font-semibold py-1 w-full ${currentView === 'documents' ? "active" : ""}`}>
                                <span className='w-full flex items-center flex-nowrap justify-normal gap-2'><Folders size={'20px'} /> <span className='text-xs md:text-sm'>Documents/Photos</span></span>
                            </button>
                        </li>
                        <li className={`w-full flex justify-normal m-0 ${currentView === 'equipment-directory' ? "active" : ""}`}>
                            <button onClick={() => setCurrentView('equipment-directory')} className={`side-nav-btn text-stone-100 font-semibold py-1 w-full ${currentView === 'equipment-directory' ? "active" : ""}`}>
                                <span className='w-full flex items-center flex-nowrap justify-normal gap-2'><NotebookTabs size={'20px'} /> <span className='text-xs md:text-sm'>Equipment Directory </span></span>
                            </button>
                        </li>
                    </ul>
                    <ul className='flex flex-col gap-4 justify-end items-center'>
                        <li className={`w-full text-nowrap flex justify-normal m-0 ${currentView === 'settings' ? "active" : ""}`}>
                            <button onClick={() => setCurrentView('settings')} className={`logout mt-4 md:mt-0 dark:bg-zinc-300 dark:text-zinc-700 flex items-center justify-center gap-2 font-semibold py-1 w-full ${currentView === 'settings' ? "active" : ""}`}>
                                <Settings />   Settings
                            </button>
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