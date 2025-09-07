import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { useNtsUsers } from '@/context/NtsUsersContext';
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
    TrendingUp
} from 'lucide-react';

interface SalesSideNavProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    className?: string;
    isDesktop?: boolean;
}

const SalesSideNav: React.FC<SalesSideNavProps> = ({ isSidebarOpen, toggleSidebar, className = '', isDesktop = false }) => {
    const supabase = useSupabaseClient<Database>();
    const { userProfile } = useNtsUsers();
    const router = useRouter();
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        sessionStorage.clear();
        localStorage.clear();
        router.push('/nts/login');
    };

    const navigationItems = [
        {
            href: '/nts/sales',
            icon: TrendingUp,
            label: 'Shipper Management',
            description: 'Manage Customers',
            color: 'from-blue-500 to-blue-600'
        },
        {
            href: '/nts/sales/documents',
            icon: Folders,
            label: 'Documents',
            description: 'Files & Media',
            color: 'from-orange-500 to-orange-600'
        },
        {
            href: '/nts/sales/chat-requests',
            icon: MessageSquareMore,
            label: 'Messages',
            description: 'Customer Chat',
            color: 'from-purple-500 to-purple-600'
        },
        {
            href: '/nts/sales/equipment-directory',
            icon: NotebookTabs,
            label: 'Equipment',
            description: 'Directory & Specs',
            color: 'from-indigo-500 to-indigo-600'
        }
    ];

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
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Ship className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight">NTS</h1>
                                <p className="text-xs text-slate-400 -mt-1">PORTAL</p>
                            </div>
                        </div>
                    </div>

                    {/* User Profile */}
                    <div className="flex flex-col items-center text-center">
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
                                {userProfile?.first_name || 'User'}
                            </h3>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                <span className="text-sm text-blue-300 font-medium">Sales Rep</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4">
                    <div className="space-y-1">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = router.pathname === item.href;
                            
                            return (
                                <Link key={item.href} href={item.href}>
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
                                        {isActive && (
                                            <div className="w-2 h-2 bg-white rounded-full shadow-lg flex-shrink-0"></div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className="px-4 pb-4 space-y-2">
                    {/* Settings */}
                    <Link href="/nts/sales/settings">
                        <div className={`group flex items-center p-3 rounded-xl transition-all duration-300 cursor-pointer ${
                            router.pathname === '/nts/sales/settings'
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
                            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-white" />
                        </div>
                        <span className="ml-3 text-sm font-medium text-slate-300">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default SalesSideNav;