import React from 'react';
import { useRouter } from "next/router";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/schema';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import Link from 'next/link';
import { PanelLeftOpen, PanelRightClose, ListCollapse, Workflow, Folders, Signature, Settings, Hammer  } from 'lucide-react';

interface UserSideNavProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    className?: string;
}

const UserSideNav: React.FC<UserSideNavProps> = ({ isSidebarOpen, toggleSidebar, className = '' }) => {
    const supabase = useSupabaseClient<Database>();
    const { userProfile } = useUser();

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

    const profilePictureUrl = userProfile?.profile_picture
        ? supabase.storage.from('profile-pictures').getPublicUrl(userProfile.profile_picture).data.publicUrl
        : 'https://www.gravatar.com/avatar?d=mp&s=100';
    const router = useRouter();
    return (
        <>
            <div>
                <button
                    className="fixed left-1 z-50 top-1 p-2 rounded-full"
                    onClick={toggleSidebar}
                >
                    {isSidebarOpen ? <PanelRightClose size={24} className='text-white z-50' /> : <PanelLeftOpen size={28} className='z-50 text-gray-900' />}
                </button>
                <nav className={`side-navbar z-50  flex flex-col h-screen py-6 drop-shadow absolute top-0 left-0 transform ${isSidebarOpen ? 'translate-x-0 z-50' : '-translate-x-full'} transition-transform duration-300  ease-in-out z-50 ${className}`}>
                    <h1 className='text-xl mt-4 md:mt-0 mb-4 self-center'>NTS Client Portal</h1>
                    <div className="w-full flex flex-col items-center gap-1 justify-center mb-6 border-b border-stone-100/40 pb-4">
                            <h3>Welcome {userProfile?.first_name || 'User'}</h3>
                   </div>
                    <ul className='flex gap-3 flex-col flex-grow space-y-1 overflow-y-auto'>
                        <li className={`w-full text-base flex justify-center mt-0 ${router.pathname == "/inventory" ? "active" : ""}`}>
                            <Link href="/inventory" className={`side-nav-btn text-stone-100 font-bold py-1 w-full ${router.pathname == "/inventory" ? "active" : ""}`}>
                                <span className='flex items-center flex-nowrap justify-normal gap-2'><ListCollapse /> <span className='text-sm'>Inventory </span></span>
                            </Link>
                        </li>
                        <li className={`w-full text-base flex justify-normal m-0 ${router.pathname == "/freight-rfq" ? "active" : ""}`}>
                            <Link href="/freight-rfq" className={`side-nav-btn text-stone-100 font-bold py-1 w-full ${router.pathname == "/freight-rfq" ? "active" : ""}`}>
                                <span className='flex items-center flex-nowrap justify-normal gap-2'><Workflow /> <span className='text-sm'>Logistics RFQ </span></span>
                            </Link>
                        </li>
                        <li className={`w-full text-base flex justify-normal m-0 ${router.pathname == "/user-documents" ? "active" : ""}`}>
                            <Link href="/user-documents" className={`side-nav-btn text-stone-100 font-bold py-1 w-full ${router.pathname == "/user-documents" ? "active" : ""}`}>
                                <span className='flex items-center flex-nowrap justify-normal gap-2'><Folders /> <span className='text-sm'>Documents </span></span>
                            </Link>
                        </li>

                        <li className="w-full flex text-base justify-normal m-0">
                            <Link href="/freight-rfq" className="side-nav-btn  text-stone-100  font-bold py-1 w-full">
                                <span className='w-full flex items-center flex-nowrap justify-normal gap-2'><Signature /> <span className='text-sm'>Procurement <br />(coming soon)</span></span>
                            </Link>
                        </li>

                        <li className="w-full flex text-base justify-normal m-0">
                            <Link href="/freight-transport" className="side-nav-btn text-stone-100 text-nowrap font-bold py-1 w-full">
                                <span className='w-full flex items-center flex-nowrap justify-normal gap-2'><Hammer /> <span className='text-sm'>Projects <br />(coming soon)</span></span>
                            </Link>
                        </li>
                    </ul>
                    <ul className='flex flex-col gap-4 justify-end items-center'>
                        <li className={`w-full text-nowrap flex justify-normal m-0 ${router.pathname == "/settings" ? "active" : ""}`}>
                            <Link href="/settings" className={`logout flex items-center justify-center gap-2 font-bold py-1 w-full ${router.pathname == "/settings" ? "active" : ""}`}>
                                <Settings />   Settings
                            </Link>
                        </li>
                        <li className="w-full flex items-centerjustify-center m-0">
                            
                            <button className="logout font-bold py-1 w-full" onClick={handleLogout}>
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