import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useNtsUsers } from '@/context/NtsUsersContext';
import Image from 'next/image';
import NotificationBell from '@/components/NotificationBell';
import { Session } from '@supabase/auth-helpers-react';
import FeedBack from '@/components/ui/FeedBack';
import { useRouter } from 'next/router';
import { Menu, X, User, Bell } from 'lucide-react';

interface SalesTopNavProps {
    session: Session | null;
    className?: string;
    isSidebarOpen?: boolean;
    toggleSidebar?: () => void;
}

const SalesTopNav: React.FC<SalesTopNavProps> = ({ session, className = '', isSidebarOpen, toggleSidebar }) => {
    const { userProfile } = useNtsUsers();
    const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
    const [profileImageError, setProfileImageError] = useState(false);
    const router = useRouter();

    // Set up profile image URL
    useEffect(() => {
        if (userProfile?.profile_picture && !profileImageError) {
            try {
                if (userProfile.profile_picture.startsWith('https://') || userProfile.profile_picture.startsWith('http://')) {
                    setProfilePictureUrl(userProfile.profile_picture);
                } else {
                    const { data } = supabase.storage
                        .from('profile-pictures')
                        .getPublicUrl(userProfile.profile_picture);
                    
                    if (data?.publicUrl) {
                        setProfilePictureUrl(data.publicUrl);
                    } else {
                        setProfilePictureUrl('https://www.gravatar.com/avatar?d=mp&s=100');
                    }
                }
            } catch (error) {
                console.error('TopNav - Error getting profile picture URL:', error);
                setProfilePictureUrl('https://www.gravatar.com/avatar?d=mp&s=100');
            }
        } else {
            setProfilePictureUrl('https://www.gravatar.com/avatar?d=mp&s=100');
        }
    }, [userProfile?.profile_picture, profileImageError]);

    const handleImageError = () => {
        setProfileImageError(true);
        setProfilePictureUrl('');
    };

    return (
        <div className={`w-full px-6 py-4 ${className}`}>
            <div className="flex items-center justify-between">
                {/* Left side - Sidebar toggle and breadcrumbs */}
                <div className="flex items-center gap-4">
                    {/* Desktop Sidebar Toggle */}
                    <button
                        onClick={toggleSidebar}
                        className="xs:hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                        aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                     {isSidebarOpen ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={toggleSidebar}
                        className="md:hidden xs:flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
                    >
                        {isSidebarOpen ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>

                    {/* Page Title/Breadcrumb */}
                    <div className="hidden sm:block">
                        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
                            {router.pathname.includes('/shipper-management') && 'Shipper Management'}
                            {router.pathname.includes('/documents') && 'Documents'}
                            {router.pathname.includes('/chat-requests') && 'Messages'}
                            {router.pathname.includes('/equipment-directory') && 'Equipment Directory'}
                            {router.pathname.includes('/settings') && 'Settings'}
                            {router.pathname === '/nts/sales' && 'Dashboard'}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Manage your sales operations efficiently
                        </p>
                    </div>
                </div>

                {/* Right side - User actions */}
                <div className="flex items-center gap-3">
                    {/* Feedback Button */}
                    <div className="hidden md:block">
                        <FeedBack />
                    </div>

                    {/* Notifications */}
                    <div className="relative">
                        <NotificationBell session={session} />
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                {userProfile?.first_name} {userProfile?.last_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Sales Representative
                            </p>
                        </div>
                        
                        <div className="relative">
                            {profilePictureUrl && !profileImageError ? (
                                <Image
                                    src={profilePictureUrl}
                                    alt="Profile"
                                    width={40}
                                    height={40}
                                    className="rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 object-cover"
                                    onError={handleImageError}
                                    unoptimized
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-sm flex items-center justify-center hover:scale-105 transition-all duration-200">
                                    <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesTopNav;