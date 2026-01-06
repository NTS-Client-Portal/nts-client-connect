import { useSession, useSupabaseClient } from '@/lib/supabase/provider';
import { Database } from '@/lib/database.types';
import Image from 'next/image';
import { User, Building2, Bell, Shield, Camera, Edit3, Save, X, AlertCircle, Check, Eye, EyeOff, Upload, UserRoundPen, BellRing, Menu } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface UserProfileFormProps {
    session: any;
}

const NtsSettings: React.FC<UserProfileFormProps> = () => {
    const session = useSession();
    const supabase = useSupabaseClient<Database>();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [notificationsError, setNotificationsError] = useState('');
    const [notificationsSuccess, setNotificationsSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [activeSection, setActiveSection] = useState('personal');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!session) return;
    
            const { data, error } = await supabase
                .from('nts_users')
                .select('id, first_name, last_name, company_id, address, phone_number, profile_picture, email_notifications')
                .eq('email', session.user.email) // Use the email for matching
                .single();
    
            if (error) {
                console.error('Error fetching user profile:', error.message);
                setProfileError('Error fetching user profile');
            } else {
                setUserId(data.id);
                setFirstName(data.first_name || '');
                setLastName(data.last_name || '');
                setCompanyName(data.company_id || '');
                setAddress(data.address || '');
                setPhoneNumber(data.phone_number || '');
                
                // Set profile picture URL using the same pattern as SalesSideNav
                if (data.profile_picture) {
                    try {
                        if (data.profile_picture.startsWith('https://') || data.profile_picture.startsWith('http://')) {
                            setProfilePictureUrl(data.profile_picture);
                        } else {
                            const { data: urlData } = supabase.storage
                                .from('profile-pictures')
                                .getPublicUrl(data.profile_picture);
                            
                            if (urlData?.publicUrl) {
                                setProfilePictureUrl(urlData.publicUrl);
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
                
                setEmail(session.user.email || '');
                setEmailNotifications(data.email_notifications || false);
                setProfilePicture(null); // Reset the profile picture input
            }
        };
    
        fetchUserProfile();
    }, [session, supabase]);

    const uploadProfilePicture = async (file: File, userId: string) => {
        const { data, error } = await supabase.storage
            .from('profile-pictures')
            .upload(`public/${userId}/${file.name}`, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (error) {
            console.error('Upload error:', error.message);
            throw new Error('Error uploading profile picture');
        }

        return data?.path || '';
    };

    const updateProfilePicture = async (userId: string, file: File) => {
        try {
            const profilePicturePath = await uploadProfilePicture(file, userId);
            
            const { error: updateError } = await supabase
                .from('nts_users')
                .update({ profile_picture: profilePicturePath })
                .eq('id', userId);

            if (updateError) {
                console.error('Error updating user profile:', updateError.message);
                setProfileError('Error updating user profile');
            } else {
                setProfileError('');
                setProfileSuccess('Profile updated successfully');
                
                // Get public URL for the uploaded image
                const { data: urlData } = supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(profilePicturePath);
                
                if (urlData?.publicUrl) {
                    setProfilePictureUrl(urlData.publicUrl);
                }
                
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error:', error.message);
            setProfileError('Error updating profile picture');
        }
    };

    const getSignedUrl = async (path: string) => {
        // Ensure the path does not include /public
        const cleanedPath = path.replace('/public', '');
    
        const { data, error } = await supabase.storage
            .from('profile-pictures')
            .createSignedUrl(cleanedPath, 60); // URL valid for 60 seconds
    
        if (error) {
            console.error('Error creating signed URL:', error.message);
            console.error('Path:', cleanedPath); // Log the path for debugging
            throw new Error('Error creating signed URL');
        }
    
        return data.signedUrl;
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !userId) return;

        setIsLoading(true);
        let profilePicturePath = '';

        if (profilePicture) {
            try {
                profilePicturePath = await uploadProfilePicture(profilePicture, userId);
            } catch (error) {
                if (error instanceof Error) {
                    setProfileError(error.message);
                } else {
                    setProfileError('An unknown error occurred');
                }
                setIsLoading(false);
                return;
            }
        }

        const { error: updateError } = await supabase
            .from('nts_users')
            .update({
                first_name: firstName,
                last_name: lastName,
                company_id: companyName,
                address: address,
                phone_number: phoneNumber,
                profile_picture: profilePicturePath,
                email_notifications: emailNotifications,
            })
            .eq('email', session.user.email);

        if (updateError) {
            console.error('Error updating user profile:', updateError.message);
            setProfileError('Error updating user profile');
        } else {
            setProfileError('');
            setProfileSuccess('Profile updated successfully');
            
            // Update profile picture URL using the same pattern as SalesSideNav
            if (profilePicturePath) {
                const { data: urlData } = supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(profilePicturePath);
                
                if (urlData?.publicUrl) {
                    setProfilePictureUrl(urlData.publicUrl);
                }
            }
            
            setIsEditing(false);
        }
        setIsLoading(false);
    };

    const handleNotificationsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        setIsLoading(true);
        const { error: updateError } = await supabase
            .from('nts_users')
            .update({
                email_notifications: emailNotifications,
            })
            .eq('email', session.user.email);

        if (updateError) {
            console.error('Error updating notification settings:', updateError.message);
            setNotificationsError('Error updating notification settings');
        } else {
            console.log('Notification settings updated successfully');
            setNotificationsError('');
            setNotificationsSuccess('Notification settings updated successfully');
        }
        setIsLoading(false);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        // Re-authenticate the user with the current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: session.user.email || '',
            password: currentPassword,
        });

        if (signInError) {
            setPasswordError('Current password is incorrect');
            setIsLoading(false);
            return;
        }

        // Update the password
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            console.error('Error updating password:', error.message);
            setPasswordError('Error updating password');
        } else {
            console.log('Password updated successfully');
            setPasswordError('');
            setPasswordSuccess('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        setIsLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && userId) {
            setProfilePicture(file);
            updateProfilePicture(userId, file);
        }
    };

    const sections = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'company', label: 'Company', icon: Building2 },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield }
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4">
                <h1 className="text-xl font-bold text-slate-900">NTS Settings</h1>
                <p className="text-sm text-slate-600">Manage your account preferences</p>
            </div>

            <div className="max-w-7xl mx-auto lg:flex lg:gap-8 lg:p-8">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 lg:flex-shrink-0">
                    <div className="lg:sticky lg:top-8">
                        {/* Desktop Header */}
                        <div className="hidden lg:block mb-8">
                            <h1 className="text-2xl font-bold text-slate-900">NTS Settings</h1>
                            <p className="text-slate-600 mt-2">Manage your account preferences</p>
                        </div>

                        {/* Mobile Section Selector */}
                        <div className="lg:hidden bg-white border-b border-slate-200">
                            <div className="flex overflow-x-auto scrollbar-hide">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
                                                activeSection === section.id
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="text-sm">{section.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:block space-y-1">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                                            activeSection === section.id
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : 'text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{section.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 lg:max-w-4xl">
                    <div className="bg-white lg:rounded-xl lg:shadow-sm lg:border border-slate-200">
                        <div className="p-6 lg:p-8">
                            {/* Personal Info Section */}
                            {activeSection === 'personal' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-semibold text-slate-900">Personal Information</h2>
                                            <p className="text-sm text-slate-600 mt-1">Update your personal details and profile picture</p>
                                        </div>
                                        {!isEditing && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                Edit Profile
                                            </button>
                                        )}
                                    </div>

                                    {profileError && (
                                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                            <AlertCircle className="w-5 h-5" />
                                            {profileError}
                                        </div>
                                    )}

                                    {profileSuccess && (
                                        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                            <Check className="w-5 h-5" />
                                            {profileSuccess}
                                        </div>
                                    )}

                                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                                        {/* Profile Picture */}
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                {profilePictureUrl ? (
                                                    <Image
                                                        src={profilePictureUrl}
                                                        alt="Profile"
                                                        width={80}
                                                        height={80}
                                                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                                                        <User className="w-8 h-8 text-slate-400" />
                                                    </div>
                                                )}
                                                {isEditing && (
                                                    <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                                                        <Camera className="w-4 h-4" />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) {
                                                                    setProfilePicture(e.target.files[0]);
                                                                }
                                                            }}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-slate-900">{firstName} {lastName}</h3>
                                                <p className="text-sm text-slate-600">{email}</p>
                                                {isEditing && (
                                                    <p className="text-xs text-slate-500 mt-1">Click the camera icon to update your profile picture</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    disabled
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Phone Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    disabled={!isEditing}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Address
                                                </label>
                                                <textarea
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    disabled={!isEditing}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                />
                                            </div>
                                        </div>

                                        {isEditing && (
                                            <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4" />
                                                            Save Changes
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                    disabled={isLoading}
                                                    className="flex items-center gap-2 px-6 py-3 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </form>
                                </div>
                            )}

                            {/* Company Section */}
                            {activeSection === 'company' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-900">Company Information</h2>
                                        <p className="text-sm text-slate-600 mt-1">Update your company details</p>
                                    </div>

                                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Company Name
                                            </label>
                                            <input
                                                type="text"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Company Address
                                            </label>
                                            <textarea
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Notifications Section */}
                            {activeSection === 'notifications' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-900">Notification Settings</h2>
                                        <p className="text-sm text-slate-600 mt-1">Choose how you want to be notified</p>
                                    </div>

                                    {notificationsError && (
                                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                            <AlertCircle className="w-5 h-5" />
                                            {notificationsError}
                                        </div>
                                    )}

                                    {notificationsSuccess && (
                                        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                            <Check className="w-5 h-5" />
                                            {notificationsSuccess}
                                        </div>
                                    )}

                                    <form onSubmit={handleNotificationsSubmit} className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                                                <div>
                                                    <h3 className="font-medium text-slate-900">Email Notifications</h3>
                                                    <p className="text-sm text-slate-600">Receive notifications via email</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={emailNotifications}
                                                        onChange={(e) => setEmailNotifications(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        Save Settings
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Security Section */}
                            {activeSection === 'security' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-900">Security Settings</h2>
                                        <p className="text-sm text-slate-600 mt-1">Update your password and security preferences</p>
                                    </div>

                                    {passwordError && (
                                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                            <AlertCircle className="w-5 h-5" />
                                            {passwordError}
                                        </div>
                                    )}

                                    {passwordSuccess && (
                                        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                            <Check className="w-5 h-5" />
                                            {passwordSuccess}
                                        </div>
                                    )}

                                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium text-slate-900">Change Password</h3>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Current Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showCurrentPassword ? 'text' : 'password'}
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        required
                                                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                    >
                                                        {showCurrentPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPassword ? 'text' : 'password'}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        required
                                                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                    >
                                                        {showNewPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Confirm New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        required
                                                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        Update Password
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NtsSettings;