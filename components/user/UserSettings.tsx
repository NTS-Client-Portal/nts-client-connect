import React, { useState, useEffect } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { 
    User, 
    Building2, 
    Bell, 
    Shield, 
    UserPlus, 
    Edit3, 
    Save, 
    X, 
    Eye, 
    EyeOff,
    Camera,
    Mail,
    Phone,
    MapPin,
    Check,
    AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import InviteUserForm from '@/components/user/InviteUserForm';
// import { updateCompanyName, getCanonicalCompanyName } from '@/lib/companyAssignment';

interface UserProfileFormProps {
    session: any;
}

const UserProfileForm: React.FC<UserProfileFormProps> = () => {
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
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!session) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('first_name, last_name, address, phone_number, profile_picture, email_notifications, company_size, company_id')
                .eq('email', session.user.email)
                .single();

            if (error) {
                console.error('Error fetching user profile:', error.message);
                setProfileError('Error fetching user profile');
            } else {
                setFirstName(data.first_name || '');
                setLastName(data.last_name || '');
                
                if (data.company_id) {
                    // Get company name from companies table
                    const { data: companyData } = await supabase
                        .from('companies')
                        .select('name')
                        .eq('id', data.company_id)
                        .single();
                    setCompanyName(companyData?.name || '');
                } else {
                    setCompanyName('');
                }
                
                setAddress(data.address || '');
                setPhoneNumber(data.phone_number || '');
                const profilePicUrl = data.profile_picture
                    ? await getSignedUrl(data.profile_picture)
                    : 'https://www.gravatar.com/avatar?d=mp&s=100';
                setProfilePictureUrl(profilePicUrl);
                setEmail(session.user.email || '');
                setEmailNotifications(data.email_notifications || true);
                setProfilePicture(null);
                setCompanyId(data.company_id || null);
            }
        };

        fetchUserProfile();
    }, [session, supabase]);

    const uploadProfilePicture = async (file: File, email: string) => {
        const { data, error } = await supabase.storage
            .from('profile-pictures')
            .upload(`public/${email}/${file.name}`, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Upload error:', error.message);
            throw new Error('Error uploading profile picture');
        }

        return data?.path || '';
    };

    const getSignedUrl = async (path: string) => {
        const { data, error } = await supabase.storage
            .from('profile-pictures')
            .createSignedUrl(path, 60);

        if (error) {
            console.error('Error creating signed URL:', error.message);
            throw new Error('Error creating signed URL');
        }

        return data.signedUrl;
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        setIsLoading(true);
        let profilePicturePath = '';

        if (profilePicture) {
            try {
                profilePicturePath = await uploadProfilePicture(profilePicture, session.user.email);
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

        const { data: userProfile, error: profileFetchError } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('email', session.user.email)
            .single();

        if (profileFetchError) {
            setProfileError('Error fetching user profile for company update');
            setIsLoading(false);
            return;
        }

        if (userProfile?.company_id && companyName) {
            // Update company name in companies table
            const { error: companyUpdateError } = await supabase
                .from('companies')
                .update({ name: companyName })
                .eq('id', userProfile.company_id);
                
            if (companyUpdateError) {
                setProfileError('Error updating company name: ' + companyUpdateError.message);
                setIsLoading(false);
                return;
            }
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
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
            const profilePicUrl = profilePicturePath
                ? supabase.storage.from('profile-pictures').getPublicUrl(profilePicturePath).data.publicUrl
                : profilePictureUrl;
            setProfilePictureUrl(profilePicUrl);
            setIsEditing(false);
        }
        setIsLoading(false);
    };

    const handleNotificationsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        setIsLoading(true);
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                email_notifications: emailNotifications,
            })
            .eq('id', session.user.id);

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
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: session.user.email || '',
            password: currentPassword,
        });

        if (signInError) {
            setPasswordError('Current password is incorrect');
            setIsLoading(false);
            return;
        }

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
        if (e.target.files && e.target.files[0]) {
            setProfilePicture(e.target.files[0]);
        }
    };

    const sections = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'company', label: 'Company', icon: Building2 },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'invite', label: 'Invite User', icon: UserPlus },
        { id: 'security', label: 'Security', icon: Shield }
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4">
                <h1 className="text-xl font-bold text-slate-900">Settings</h1>
                <p className="text-sm text-slate-600">Manage your account preferences</p>
            </div>

            <div className="max-w-7xl mx-auto lg:flex lg:gap-8 lg:p-8">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 lg:flex-shrink-0">
                    <div className="lg:sticky lg:top-8">
                        {/* Desktop Header */}
                        <div className="hidden lg:block mb-8">
                            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
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
                                            <span className="text-sm font-medium">{section.label}</span>
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
                                            <p className="text-sm text-slate-600 mt-1">Update your personal details</p>
                                        </div>
                                        {!isEditing && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                Edit
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
                                                        className="w-20 h-20 rounded-full object-cover border-4 border-slate-200"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                                                        <User className="w-8 h-8 text-slate-500" />
                                                    </div>
                                                )}
                                                {isEditing && (
                                                    <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                                                        <Camera className="w-4 h-4" />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFileChange}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-slate-900">Profile Photo</h3>
                                                <p className="text-sm text-slate-600">Upload a new profile picture</p>
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
                                        </div>

                                        <div>
                                            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                                                <Mail className="w-4 h-4 inline mr-1" />
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                disabled
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                                                <Phone className="w-4 h-4 inline mr-1" />
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

                                        <div>
                                            <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                                                <MapPin className="w-4 h-4 inline mr-1" />
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

                                        {isEditing && (
                                            <div className="flex items-center gap-3 pt-4">
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                    className="flex items-center gap-2 px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
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
                                </div>
                            )}

                            {/* Notifications Section */}
                            {activeSection === 'notifications' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-900">Notification Preferences</h2>
                                        <p className="text-sm text-slate-600 mt-1">Manage how you receive notifications</p>
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

                                    <form onSubmit={handleNotificationsSubmit}>
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
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="mt-6 flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Save className="w-4 h-4" />
                                            {isLoading ? 'Saving...' : 'Save Preferences'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Invite User Section */}
                            {activeSection === 'invite' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-900">Invite Team Members</h2>
                                        <p className="text-sm text-slate-600 mt-1">Send invitations to new team members</p>
                                    </div>
                                    <InviteUserForm companyId={companyId} />
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
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Current Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-3 top-8 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                                                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-8 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                                                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-8 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Shield className="w-4 h-4" />
                                            {isLoading ? 'Updating...' : 'Update Password'}
                                        </button>
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

export default UserProfileForm;
