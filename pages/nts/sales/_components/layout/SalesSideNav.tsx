import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { useNtsUsers } from '@/context/NtsUsersContext';
import Image from 'next/image';
import { 
    PanelLeftOpen, 
    PanelRightClose, 
    MessageSquareMore, 
    ChevronRightCircle, 
    Folders, 
    NotebookTabs, 
    Settings, 
    MoveHorizontal, 
    ChartArea,
    LogOut,
    X,
    User
} from 'lucide-react';

interface SalesSideNavProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    className?: string;
    isDesktop?: boolean; // New prop to differentiate desktop vs mobile
}

const SalesSideNav: React.FC<SalesSideNavProps> = ({ isSidebarOpen, toggleSidebar, className = '', isDesktop = false }) => {
    const supabase = useSupabaseClient<Database>();
    const { userProfile } = useNtsUsers();
    const router = useRouter();
    const [profileImageError, setProfileImageError] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState<string>('');

    // Set up profile image URL
    useEffect(() => {
        if (userProfile?.profile_picture && !profileImageError) {
            try {
                console.log('Profile picture field:', userProfile.profile_picture);
                
                // Check if the profile_picture is already a full URL
                if (userProfile.profile_picture.startsWith('https://') || userProfile.profile_picture.startsWith('http://')) {
                    console.log('Using full URL directly:', userProfile.profile_picture);
                    setProfileImageUrl(userProfile.profile_picture);
                } else {
                    // It's a file path, so construct the URL
                    let filename = userProfile.profile_picture;
                    
                    // Don't extract filename if it includes folders we need
                    console.log('Using file path:', filename);
                    
                    const { data } = supabase.storage
                        .from('profile-pictures')
                        .getPublicUrl(filename);
                    
                    console.log('Generated URL:', data?.publicUrl);
                    
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
        console.error('Image failed to load:', profileImageUrl);
        setProfileImageError(true);
        setProfileImageUrl('');
    };

    // Close sidebar when route changes on mobile
    useEffect(() => {
        const handleRouteChange = () => {
            if (window.innerWidth < 1280) { // xl breakpoint
                toggleSidebar();
            }
        };

        router.events?.on('routeChangeComplete', handleRouteChange);
        return () => {
            router.events?.off('routeChangeComplete', handleRouteChange);
        };
    }, [router.events, toggleSidebar]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (isSidebarOpen && window.innerWidth < 1280) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'unset';
            }
        }

        return () => {
            if (typeof window !== 'undefined') {
                document.body.style.overflow = 'unset';
            }
        };
    }, [isSidebarOpen]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        sessionStorage.clear();
        localStorage.clear();
        router.push('/nts/login');
    };

    const navigationItems = [
        {
            href: '/nts/sales',
            icon: ChartArea,
            label: 'Shipper Profiles',
            description: 'Manage customer accounts'
        },
        {
            href: '/nts/sales/documents',
            icon: Folders,
            label: 'Documents/Photos',
            description: 'View and manage files'
        },
        {
            href: '/nts/sales/chat-requests',
            icon: MessageSquareMore,
            label: 'Shipper Connect',
            description: 'Customer communications'
        },
        {
            href: '/nts/sales/equipment-directory',
            icon: NotebookTabs,
            label: 'Equipment Directory',
            description: 'Browse equipment catalog'
        }
    ];

    return (
        <>
            {/* Mobile Menu Button - only show for mobile version */}
            {!isDesktop && (
                <button
                    className="fixed top-4 left-4 z-[60] xl:hidden bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-xl touch-manipulation active:scale-95"
                    onClick={toggleSidebar}
                    aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
                >
                    {isSidebarOpen ? (
                        <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    ) : (
                        <PanelLeftOpen className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    )}
                </button>
            )}

            {/* Backdrop Overlay for Mobile - only show for mobile version */}
            {!isDesktop && isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-[45] xl:hidden transition-opacity duration-300 ease-in-out"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <nav 
                className={`
                    w-56 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 
                    transition-transform duration-300 ease-in-out
                    ${isDesktop 
                        ? 'relative h-full' 
                        : `fixed top-0 left-0 h-full z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                    }
                    ${className}
                `}
            >
                {/* Header Section */}
                <div className="p-6 border-b border-gray-700">
                    {/* Logo */}
                    <div className="flex items-center justify-center mb-6">
                        <h1 className="text-white text-md font-bold tracking-wider flex items-center gap-1">
                            SHIPPER
                            <MoveHorizontal className="w-5 h-5 text-orange-400" />
                            CONNECT
                        </h1>
                    </div>

                    {/* User Welcome Section */}
                    <div className="flex flex-col items-center space-y-3">
                        <div className="relative">
                            {profileImageUrl && !profileImageError ? (
                                <Image
                                    src={profileImageUrl}
                                    alt="Profile"
                                    width={64}
                                    height={64}
                                    className="rounded-full border-3 border-gray-600 shadow-lg object-cover"
                                    onError={handleImageError}
                                    unoptimized
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gray-600 rounded-full border-3 border-gray-600 shadow-lg flex items-center justify-center">
                                    <User className="w-8 h-8 text-gray-300" />
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-800"></div>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-300 text-sm">Welcome back,</p>
                            <p className="text-white font-semibold text-lg">
                                {userProfile?.first_name || 'User'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 px-4 py-6 overflow-y-auto">
                    <nav className="space-y-2">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = router.pathname === item.href;
                            
                            return (
                                <Link key={item.href} href={item.href}>
                                    <div
                                        className={`
                                            group flex items-center px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                                            ${isActive 
                                                ? 'bg-blue-600 text-white shadow-lg transform scale-[1.02]' 
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:transform hover:scale-[1.01]'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                {item.label}
                                            </p>
                                            <p className={`text-xs truncate ${isActive ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-400'}`}>
                                                {item.description}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Section */}
                <div className="p-4 border-t border-gray-700 space-y-2">
                    {/* Settings */}
                    <Link href="/nts/sales/settings">
                        <div
                            className={`
                                group flex items-center px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                                ${router.pathname === '/nts/sales/settings'
                                    ? 'bg-gray-700 text-white' 
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }
                            `}
                        >
                            <Settings className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white" />
                            <span className="text-sm font-medium">Settings</span>
                        </div>
                    </Link>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full group flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-gray-300 hover:bg-red-600 hover:text-white touch-manipulation active:scale-95"
                    >
                        <LogOut className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white" />
                        <span className="text-sm text-gray-100 font-medium">Logout</span>
                    </button>
                </div>
            </nav>
        </>
    );
};

export default SalesSideNav;