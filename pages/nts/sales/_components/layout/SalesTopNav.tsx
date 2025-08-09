import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useNtsUsers } from '@/context/NtsUsersContext';
import Image from 'next/image';
import NotificationBell from '@/components/NotificationBell';
import { Session } from '@supabase/auth-helpers-react';
import FeedBack from '@/components/ui/FeedBack';
import { useRouter } from 'next/router';
import { Search, Sun, Moon, User } from 'lucide-react';

interface SalesTopNavProps {
    session: Session | null;
    className?: string;
    isSidebarOpen?: boolean;
    toggleSidebar?: () => void;
}

const SalesTopNav: React.FC<SalesTopNavProps> = ({ session, className = '', isSidebarOpen, toggleSidebar }) => {
    const { userProfile } = useNtsUsers();
    const [darkMode, setDarkMode] = useState(false);
    const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
    const [profileImageError, setProfileImageError] = useState(false);
    const router = useRouter();

    // Set up profile image URL with same logic as SideNav
    useEffect(() => {
        if (userProfile?.profile_picture && !profileImageError) {
            try {
                console.log('TopNav - Profile picture field:', userProfile.profile_picture);
                
                // Check if the profile_picture is already a full URL
                if (userProfile.profile_picture.startsWith('https://') || userProfile.profile_picture.startsWith('http://')) {
                    console.log('TopNav - Using full URL directly:', userProfile.profile_picture);
                    setProfilePictureUrl(userProfile.profile_picture);
                } else {
                    // It's a file path, so construct the URL
                    let filename = userProfile.profile_picture;
                    
                    console.log('TopNav - Using file path:', filename);
                    
                    const { data } = supabase.storage
                        .from('profile-pictures')
                        .getPublicUrl(filename);
                    
                    console.log('TopNav - Generated URL:', data?.publicUrl);
                    
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
        console.error('TopNav - Image failed to load:', profilePictureUrl);
        setProfileImageError(true);
        setProfilePictureUrl('');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        sessionStorage.clear();
        localStorage.clear();
        router.push('/nts/login');
    };

    return (
        <nav className={`w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left side - Search or breadcrumbs can go here */}
                    <div className="flex items-center space-x-4">
                        {/* Placeholder for search or breadcrumb */}
                        <div className="hidden md:flex items-center space-x-2">
                            <FeedBack />
                        </div>
                    </div>

                    {/* Right side - User actions */}
                    <div className="flex items-center space-x-3">
                        {/* Notifications */}
                        <div className="relative">
                            <NotificationBell session={session} />
                        </div>

                        {/* Feedback Button for Mobile */}
                        <div className="md:hidden">
                            <FeedBack />
                        </div>

                        {/* User Profile */}
                        <div className="flex items-center space-x-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {userProfile?.first_name} {userProfile?.last_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
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
                                        className="rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-200 object-cover"
                                        onError={handleImageError}
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    </div>
                                )}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default SalesTopNav;