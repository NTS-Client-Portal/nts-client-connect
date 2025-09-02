import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import Image from 'next/image';
import { 
    Menu,
    X,
    ChartArea,
    Folders,
    MessageSquareMore,
    NotebookTabs,
    Settings,
    LogOut,
    User,
    ShipIcon as Ship,
    TruckIcon,
    ChevronDown, 
    ChevronUp
} from 'lucide-react';
import { TfiWrite } from "react-icons/tfi";
import { GrDocumentVerified } from "react-icons/gr";
import { useDocumentNotification } from '@/context/DocumentNotificationContext';

interface UserSideNavProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    className?: string;
    isDesktop?: boolean;
}

interface AssignedSalesUser {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
}

const UserSideNav: React.FC<UserSideNavProps> = ({ isSidebarOpen, toggleSidebar, className = '', isDesktop = false }) => {
    const supabase = useSupabaseClient<Database>();
    const { userProfile } = useProfilesUser();
    const { newDocumentAdded, setNewDocumentAdded } = useDocumentNotification();
    const router = useRouter();
    const [assignedSalesUsers, setAssignedSalesUsers] = useState<AssignedSalesUser[]>([]);
    const [ntsUserProfile, setNtsUserProfile] = useState<AssignedSalesUser | null>(null);
    const [isLogisticsDropdownOpen, setIsLogisticsDropdownOpen] = useState(true);
    const [profileImageError, setProfileImageError] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState<string>('');

    // Profile image setup
    useEffect(() => {
        if (userProfile?.profile_picture && !profileImageError) {
            try {
                if (userProfile.profile_picture.startsWith('https://') || userProfile.profile_picture.startsWith('http://')) {
                    setProfileImageUrl(userProfile.profile_picture);
                } else {
                    const { data } = supabase.storage
                        .from('profile-pictures')
                        .getPublicUrl(userProfile.profile_picture);
                    
                    if (data?.publicUrl) {
                        setProfileImageUrl(data.publicUrl);
                    } else {
                        setProfileImageUrl('https://www.gravatar.com/avatar?d=mp&s=100');
                    }
                }
            } catch (error) {
                console.error('Error getting profile picture URL:', error);
                setProfileImageUrl('https://www.gravatar.com/avatar?d=mp&s=100');
            }
        } else {
            setProfileImageUrl('https://www.gravatar.com/avatar?d=mp&s=100');
        }
    }, [userProfile?.profile_picture, supabase, profileImageError]);

    const handleImageError = () => {
        setProfileImageError(true);
        setProfileImageUrl('');
    };

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

    const navigationItems = [
        {
            href: '/user',
            icon: ChartArea,
            label: 'Dashboard',
            description: 'Overview & Analytics',
            color: 'from-blue-500 to-blue-600'
        },
        {
            href: '/user/logistics-management',
            icon: TruckIcon,
            label: 'Logistics Management',
            description: 'Transportation Hub',
            color: 'from-blue-500 to-blue-600',
            // Remove hasDropdown, make it a clickable navigation item
            subMenu: [
                {
                    href: '/user/quote-request',
                    icon: TfiWrite,
                    label: 'Quote Form',
                    description: 'Request Pricing'
                },
                {
                    href: '/user/order-form', 
                    icon: GrDocumentVerified,
                    label: 'Order Form',
                    description: 'Place Orders'
                }
            ]
        },
        // {
        //     href: '/user/inventory',
        //     icon: NotebookTabs,
        //     label: 'Inventory',
        //     description: 'Stock & Supplies',
        //     color: 'from-orange-500 to-orange-600'
        // },
        {
            href: '/user/documents',
            icon: Folders,
            label: 'Documents',
            description: 'Files & Pictures',
            color: 'from-blue-500 to-blue-600',
            hasNotification: newDocumentAdded
        }
    ];

    const toggleLogisticsDropdown = () => {
        setIsLogisticsDropdownOpen(!isLogisticsDropdownOpen);
    };

    if (!isDesktop && !isSidebarOpen) return null;

    return (
        <>
            {/* Sidebar Content */}
            <div className="nts-sidebar-content">
                {/* Header */}
                <div className="nts-sidebar-header">
                    {/* Brand */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="flex items-center gap-3">
                            <Image
                                src="/nts-logo.png"
                                alt="NTS Logo"
                                width={150}
                                height={75}
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>

                    {/* User Profile */}
                    {/* <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            {profileImageUrl && !profileImageError ? (
                                <Image
                                    src={profileImageUrl}
                                    alt="Profile"
                                    width={80}
                                    height={80}
                                    className="rounded-2xl border-3 border-white/20 shadow-xl object-cover backdrop-blur-sm"
                                    onError={handleImageError}
                                    unoptimized
                                />
                            ) : (
                                <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl border-3 border-white/20 shadow-xl flex items-center justify-center">
                                    <User className="w-10 h-10 text-slate-300" />
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-3 border-slate-800 shadow-lg"></div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                                {userProfile?.first_name || userProfile?.company_name || 'User'}
                            </h3>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
                                <span className="text-sm text-emerald-300 font-medium">Shipper</span>
                            </div>
                        </div>
                    </div> */}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4">
                    <div className="space-y-1">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = router.pathname === item.href;
                            
                            return (
                                <div key={item.href}>
                                    <Link href={item.href}>
                                        <div
                                            className={`group relative flex items-center p-3 rounded-xl transition-all duration-300 cursor-pointer ${
                                                isActive 
                                                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-black/20 border border-white/20` 
                                                    : 'text-slate-100 hover:text-white hover:bg-white/10 border border-transparent'
                                            }`}
                                        >
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
                                                isActive 
                                                    ? 'bg-white/20 shadow-md' 
                                                    : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                                            }`}>
                                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                                            </div>
                                            <div className="ml-3 flex-1 min-w-0">
                                                <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'} truncate`}>
                                                    {item.label}
                                                </p>
                                                <p className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-400 group-hover:text-slate-200'} truncate`}>
                                                    {item.description}
                                                </p>
                                            </div>
                                            {item.hasNotification && (
                                                <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg flex-shrink-0" onClick={() => setNewDocumentAdded(false)}></div>
                                            )}
                                            {isActive && (
                                                <div className="w-2 h-2 bg-white rounded-full shadow-lg flex-shrink-0"></div>
                                            )}
                                        </div>
                                    </Link>
                                    
                                    {/* SubMenu for Logistics Management */}
                                    {item.subMenu && Array.isArray(item.subMenu) && (
                                        <div className="mt-2 ml-8 space-y-1">
                                            {item.subMenu.map((subItem) => {
                                                const SubIcon = subItem.icon;
                                                const isSubActive = router.pathname === subItem.href;
                                                return (
                                                    <Link key={subItem.href} href={subItem.href}>
                                                        <div className={`group flex items-center p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                                                            isSubActive
                                                                ? 'bg-slate-700 text-white shadow-md'
                                                                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                                        }`}>
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-700/50 group-hover:bg-slate-600/50">
                                                                <SubIcon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                                            </div>
                                                            <div className="ml-3">
                                                                <p className="text-sm font-medium">{subItem.label}</p>
                                                                <p className="text-xs text-slate-400">{subItem.description}</p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className="px-4 pb-4 space-y-2">
                    {/* Settings */}
                    <Link href="/user/settings">
                        <div className={`group flex items-center p-3 rounded-xl transition-all duration-300 cursor-pointer ${
                            router.pathname === '/user/settings'
                                ? 'bg-slate-700 text-white shadow-lg' 
                                : 'text-slate-300 hover:text-white hover:bg-white/10'
                        }`}>
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700/50 group-hover:bg-slate-600/50">
                                <Settings className="w-4 h-4 text-slate-400 group-hover:text-white" />
                            </div>
                            <span className="ml-3 text-sm font-medium">Settings</span>
                        </div>
                    </Link>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full group flex items-center p-3 rounded-xl transition-all duration-300 text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:shadow-lg hover:shadow-red-500/20"
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/20 group-hover:bg-white/20">
                            <LogOut className="w-4 h-4 text-red-400 group-hover:text-white" />
                        </div>
                        <span className="ml-3 text-sm text-white font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default UserSideNav;