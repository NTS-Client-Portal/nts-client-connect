import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import Image from 'next/image';
import { PanelLeftOpen, PanelRightClose, Workflow, MessageSquareMore, Folders, NotebookTabs, Settings, TruckIcon } from 'lucide-react';
import { TfiWrite } from "react-icons/tfi";
import { GrDocumentVerified } from "react-icons/gr";
import { useDocumentNotification } from '@/context/DocumentNotificationContext';

interface UserSideNavProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    className?: string;
}

interface AssignedSalesUser {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
}

const UserSideNav: React.FC<UserSideNavProps> = ({ isSidebarOpen, toggleSidebar, className = '' }) => {
    const supabase = useSupabaseClient<Database>();
    const { userProfile } = useProfilesUser();
    const { newDocumentAdded, setNewDocumentAdded } = useDocumentNotification();
    const router = useRouter();
    const [assignedSalesUsers, setAssignedSalesUsers] = useState<AssignedSalesUser[]>([]);
    const [ntsUserProfile, setNtsUserProfile] = useState<AssignedSalesUser | null>(null);

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
    }, [userProfile, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        sessionStorage.clear();
        localStorage.clear();
        router.push('/');
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
                            priority
                        />
                    </div>
                    <span className="w-full flex flex-col items-center gap-1 justify-center mb-6 border-b border-stone-100/40 pb-4">
                        <h3 className='font-normal'>Welcome {userProfile?.first_name || 'User'}</h3>
                    </span>
                    <ul className='flex flex-col flex-grow overflow-y-auto'>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user' || router.pathname === '/' ? "active" : ""}`}>
                            <Link href="/user" className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user' || router.pathname === '/' ? "active" : ""}`}>
                                <span className='flex items-center flex-nowrap justify-normal gap-2 py-2 pl-3'><Workflow size={'20px'} /> Dashboard</span>
                            </Link>
                        </li>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user/logistics-management' || router.pathname === '/user/quote-request' || router.pathname === '/user/order-request' ? "active" : ""}`}>
                            <Link href="/user/logistics-management" className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/logistics-management' || router.pathname === '/' ? "active" : ""}`}>
                                <span className='flex items-center flex-nowrap justify-normal gap-2 py-2 pl-3'><TruckIcon size={'20px'} /> <span className='text-xs md:text-sm '>Logistics Management </span></span>
                            </Link>
                        </li>
                        <li className={`w-full flex justify-normal m-0 pl-6 ${router.pathname === '/user/quote-request' ? "active" : ""}`}>
                            <Link href="/user/quote-request" className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/quote-request' ? "active" : ""}`}>
                                <span className='flex items-center flex-nowrap justify-normal gap-2 py-2 pl-3'><TfiWrite size={'20px'} /> <span className='text-xs md:text-sm '>Quote Form </span></span>
                            </Link>
                        </li>
                        <li className={`w-full flex justify-normal m-0 pl-6 ${router.pathname === '/user/order-form' ? "active" : ""}`}>
                            <Link href="/user/order-form" className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/order-form' ? "active" : ""}`}>
                                <span className='flex items-center flex-nowrap justify-normal gap-2 py-2 pl-3'><GrDocumentVerified size={'20px'} /> <span className='text-xs md:text-sm '>Order Form </span></span>
                            </Link>
                        </li>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user/inventory' ? "active" : ""}`}>
                            <Link href="/user/inventory" className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/inventory' ? "active" : ""}`}>
                                <span className='w-full flex items-center flex-nowrap justify-normal gap-2 py-2 pl-3'><NotebookTabs size={'20px'} /> <span className='text-xs md:text-sm'>Inventory </span></span>
                            </Link>
                        </li>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user/documents' ? "active" : ""}`}>
                            <Link href="/user/documents" className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/documents' ? "active" : ""}`} onClick={() => setNewDocumentAdded(false)}>
                                <span className='flex items-center flex-nowrap justify-normal gap-2 py-2 pl-3 relative'>
                                    <Folders size={'20px'} />
                                    <span className='text-xs md:text-sm '>Documents/Pictures</span>
                                    {newDocumentAdded && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full z-10"></span>}
                                </span>
                            </Link>
                        </li>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user/shipper-broker-connect' ? "active" : ""}`}>
                            <Link href="/user/shipper-broker-connect" className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/shipper-broker-connect' ? "active" : ""}`}>
                                <span className='w-full flex items-center flex-nowrap justify-normal gap-2 py-2 pl-3'><MessageSquareMore size={'20px'} /> <span className='text-xs md:text-sm'>
                                    NTS Support </span></span>
                            </Link>
                        </li>
                        <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user/equipment-directory' ? "active" : ""}`}>
                            <Link href="/user/equipment-directory" className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/equipment-directory' ? "active" : ""}`}>
                                <span className='w-full flex items-center flex-nowrap justify-normal gap-2 py-2 pl-3'><NotebookTabs size={'20px'} /> <span className='text-xs md:text-sm'>Equipment Directory </span></span>
                            </Link>
                        </li>
                    </ul>
                    <ul className='flex flex-col gap-4 justify-end items-center'>
                        <li className={`w-full text-nowrap flex justify-normal m-0 ${router.pathname === '/user/settings' ? "active" : ""}`}>
                            <Link href="/user/settings" className={`logout mt-4 md:mt-0 dark:bg-zinc-300 dark:text-zinc-700 flex items-center justify-center gap-2 font-semibold py-1 w-full ${router.pathname === '/user/settings' ? "active" : ""}`}>
                                <Settings />   Settings
                            </Link>
                        </li>
                        <li className="w-full flex items-center justify-center m-0">
                            <button className="logout dark:bg-zinc-300 dark:text-zinc-700 font-semibold py-1 w-full" onClick={handleLogout}>
                                Logout
                            </button>
                        </li>
                    </ul>
                </nav>
            </div >
        </>
    );
};

export default UserSideNav;