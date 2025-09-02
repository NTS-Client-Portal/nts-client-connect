import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import Image from 'next/image';
import NotificationBell from '@/components/NotificationBell';
import FeedBack from '@/components/ui/FeedBack';
import Link from 'next/link';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { 
    User, 
    Settings, 
    LogOut, 
    ChevronDown, 
    Bell,
    MessageSquare,
    Menu
} from 'lucide-react';

interface UserTopNavProps {
    className?: string;
    toggleSidebar?: () => void;
}

interface AssignedSalesUser {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
}

const UserTopNav: React.FC<UserTopNavProps> = ({ className = '', toggleSidebar }) => {
    const { userProfile } = useProfilesUser();
    const session = useSession();
    const [profilePictureUrl, setProfilePictureUrl] = useState<string>('https://www.gravatar.com/avatar?d=mp&s=100');
    const [profileImageError, setProfileImageError] = useState(false);
    const [assignedSalesUsers, setAssignedSalesUsers] = useState<AssignedSalesUser[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const router = useRouter();

    // Profile image setup
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
                console.error('Error getting profile picture URL:', error);
                setProfilePictureUrl('https://www.gravatar.com/avatar?d=mp&s=100');
            }
        } else {
            setProfilePictureUrl('https://www.gravatar.com/avatar?d=mp&s=100');
        }
    }, [userProfile?.profile_picture, profileImageError]);

    const handleImageError = () => {
        setProfileImageError(true);
        setProfilePictureUrl('https://www.gravatar.com/avatar?d=mp&s=100');
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
    }, [userProfile]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        sessionStorage.clear();
        localStorage.clear();
        router.push('/');
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    return (
        <header className={`bg-white border-b border-slate-200 shadow-sm ${className}`}>
            <div className="flex items-center justify-between md:px-6 px-3 py-4">
                {/* Left side - Mobile menu + Page title */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Toggle */}
                    {toggleSidebar && (
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                            aria-label="Toggle menu"
                        >
                            <Menu className="w-6 h-6 text-slate-700" />
                        </button>
                    )}
                    
                    <div>
                        <h1 className="md:text-xl font-semibold text-slate-900">
                            {userProfile?.company_name || 'Dashboard'}
                        </h1>
                        <p className="text-sm text-slate-600">
                            Welcome back, {userProfile?.first_name || 'User'}
                        </p>
                    </div>
                </div>

                {/* Right side - User actions */}
                <div className="flex items-center gap-4">
                    {/* Feedback Button */}
                    <div className="hidden md:block">
                        <FeedBack />
                    </div>

                    {/* Notifications */}
                    <div className="relative">
                        <NotificationBell session={session} />
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={toggleDropdown}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                        >
                            <div className="relative">
                                {profilePictureUrl && !profileImageError ? (
                                    <Image
                                        src={profilePictureUrl}
                                        alt="Profile"
                                        width={40}
                                        height={40}
                                        className="rounded-full border-2 border-slate-200 object-cover"
                                        onError={handleImageError}
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full border-2 border-slate-200 flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-slate-900">
                                    {userProfile?.first_name || 'User'}
                                </p>
                                <p className="text-xs text-slate-500">Shipper</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setDropdownOpen(false)}
                                />
                                
                                {/* Dropdown Content */}
                                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-20">
                                    {/* User Info Section */}
                                    <div className="p-4 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                {profilePictureUrl && !profileImageError ? (
                                                    <Image
                                                        src={profilePictureUrl}
                                                        alt="Profile"
                                                        width={48}
                                                        height={48}
                                                        className="rounded-full border-2 border-slate-200 object-cover"
                                                        onError={handleImageError}
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full border-2 border-slate-200 flex items-center justify-center">
                                                        <User className="w-6 h-6 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {userProfile?.first_name || 'User'}
                                                </p>
                                                <p className="text-sm text-slate-600">
                                                    {userProfile?.email}
                                                </p>
                                                <div className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 border border-emerald-200 mt-1">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                                                    <span className="text-xs text-emerald-700 font-medium">Shipper</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assigned Sales Rep Section */}
                                    {assignedSalesUsers.length > 0 && (
                                        <div className="p-4 border-b border-slate-100">
                                            <p className="text-sm font-semibold text-slate-700 mb-2">
                                                Your Sales Representative
                                            </p>
                                            {assignedSalesUsers.map((user, index) => (
                                                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <p className="font-medium text-blue-900">
                                                        {user.first_name} {user.last_name}
                                                    </p>
                                                    <p className="text-sm text-blue-700">
                                                        📞 {user.phone_number}
                                                    </p>
                                                    <p className="text-sm text-blue-700">
                                                        ✉️ {user.email}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        <Link 
                                            href="/user/settings"
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors duration-200"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span>Account Settings</span>
                                        </Link>
                                        
                                        <div className="md:hidden">
                                            <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700">
                                                <MessageSquare className="w-4 h-4" />
                                                <span>Feedback</span>
                                                <FeedBack />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 w-full text-left"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Sign out</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default UserTopNav;