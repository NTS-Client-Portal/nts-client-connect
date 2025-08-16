import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import Image from 'next/image';
import { Menu, Expand, Workflow, MessageSquareMore, Folders, NotebookTabs, Settings, TruckIcon } from 'lucide-react';
import { TfiWrite } from "react-icons/tfi";
import { GrDocumentVerified } from "react-icons/gr";
import { useDocumentNotification } from '@/context/DocumentNotificationContext';
import { RiLogoutCircleLine } from "react-icons/ri";
import { ChevronDown, ChevronUp } from 'lucide-react'; // For caret icons

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
    const [isLogisticsDropdownOpen, setIsLogisticsDropdownOpen] = useState(true);

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

    const toggleLogisticsDropdown = () => {
        setIsLogisticsDropdownOpen(!isLogisticsDropdownOpen);
    };

    return (
        <div>
            {/* Toggle button for mobile */}
            <div className="xl:hidden">
                <button
                    className="fixed z-50 top-1 left-2 md:left-0 p-2 drop-shadow-lg rounded-full"
                    onClick={toggleSidebar}
                >
                    {isSidebarOpen ? (
                        <Menu size={24} className="text-white z-50 drop-shadow-lg" />
                    ) : (
                        <Expand size={28} className="z-50 text-zinc-600 drop-shadow-lg" />
                    )}
                </button>
            </div>

            {/* Sidebar navigation */}
            <nav className={`nts-sidebar-content pt-12 md:pt-0 flex flex-col items-start h-full py-6 transition-all duration-300 ease-in-out ${isSidebarOpen ? '' : 'collapsed items-center'}`}>

                {/* Logo */}
                <div className="flex pt-5 lg:mt-2 2xl:mt-0 mb-3 items-center justify-center font-bold flex-nowrap side-navbar-logo w-full">
                    <Image
                        src="/nts-logo.png"
                        alt="NTS Logo"
                        width={150}
                        height={75}
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Navigation links */}
                <ul className="flex flex-col items-center flex-grow overflow-y-auto w-full">
                    <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user' ? 'active' : ''}`}>
                        <Link href="/user" className={`side-nav-btn font-semibold text-stone-100 w-full ${router.pathname === '/user' ? "active" : ""}`}>
                            <span className="flex items-center justify-normal gap-2 py-2">
                                <Workflow className='md:hidden' size="20px" />
                                <span className='text-xs md:text-sm'>Dashboard</span>
                            </span>
                        </Link>
                    </li>

                    {/* Logistics Management with Dropdown */}
                    <li className="w-full">
                        <div
                            className={`flex items-center justify-normal gap-3 w-fit py-2 side-nav-btn font-semibold ${router.pathname === '/user/logistics-management' ? 'active' : ''}`}
                        >
                            {/* Link to Logistics Management */}
                            <Link
                                href="/user/logistics-management"
                                className="flex items-center gap-2 text-stone-100 w-full"
                            >
                                <TruckIcon className='md:hidden' size="20px" />
                                <span className='text-xs md:text-sm'>Logistics Management</span>
                            </Link>

                            {/* Dropdown Toggle */}
                            <button
                                onClick={toggleLogisticsDropdown}
                                className="text-stone-100"
                                aria-label="Toggle Logistics Dropdown"
                            >
                                {isLogisticsDropdownOpen ? <ChevronUp size="20px" /> : <ChevronDown size="20px" />}
                            </button>
                        </div>

                        {/* Dropdown Menu */}
                        {isLogisticsDropdownOpen && (
                            <ul className="mt-2">
                                <li className={`w-full ${router.pathname === '/user/quote-request' ? 'active' : ''}`}>
                                    <Link href="/user/quote-request" className="side-nav-btn text-stone-100 font-semibold w-full">
                                        <span className="pl-6 flex items-center gap-2 py-2">
                                            <TfiWrite className='md:hidden' size="20px" />
                                            <span className='text-xs md:text-sm'>Quote Form</span>
                                        </span>
                                    </Link>
                                </li>
                                <li className={`w-full ${router.pathname === '/user/order-form' ? 'active' : ''}`}>
                                    <Link href="/user/order-form" className="side-nav-btn text-stone-100 font-semibold w-full">
                                        <span className="pl-6 flex items-center gap-2 py-2">
                                            <GrDocumentVerified className='md:hidden' size="20px" />
                                            <span className='text-xs md:text-sm'>Order Form</span>
                                        </span>
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>

                    {/* Other navigation links */}
                    <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user/inventory' ? "active" : ""}`}>
                        <Link href="/user/inventory" className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/inventory' ? "active" : ""}`}>
                            <span className='w-full flex items-center flex-nowrap justify-normal gap-2 py-2'>
                                <NotebookTabs className='md:hidden' size={'16px'} />
                                <span className='text-xs md:text-sm'>Inventory</span>
                            </span>
                        </Link>
                    </li>
                    <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user/documents' ? "active" : ""}`}>
                        <Link href="/user/documents" className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/documents' ? "active" : ""}`} onClick={() => setNewDocumentAdded(false)}>
                            <span className='flex items-center flex-nowrap justify-normal gap-2 py-2 relative'>
                                <Folders className='md:hidden' size={'16px'} />
                                <span className='text-xs md:text-sm'>Documents/Pictures</span>
                                {newDocumentAdded && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full z-10"></span>}
                            </span>
                        </Link>
                    </li>
                    <li className={`w-full flex justify-normal m-0 ${router.pathname === '/user/settings' ? "active" : ""}`}>
                        <Link href="/user/settings" className={`side-nav-btn text-stone-100 font-semibold w-full ${router.pathname === '/user/settings' ? "active" : ""}`}>
                            <span className='w-full flex items-center flex-nowrap justify-normal gap-2 py-2'>
                                <NotebookTabs className='md:hidden' size={'16px'} />
                                <span className='text-xs md:text-sm'>Settings</span>
                            </span>
                        </Link>
                    </li>
                </ul>

                {/* Settings and Logout */}
                <ul className='flex flex-col gap-4 justify-center items-center mb-4'>
                    <li className="w-full flex items-center justify-center m-0">
                        <button
                            className="text-white dark:bg-zinc-300 dark:text-zinc-700 font-semibold py-1 w-full flex items-center justify-center gap-2 side-nav-btn"
                            onClick={handleLogout}
                        >
                            <span className='flex items-center justify-start gap-2 md:pl-3'>
                                <RiLogoutCircleLine className='md:hidden' />
                                <span>Logout</span>
                            </span>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default UserSideNav;