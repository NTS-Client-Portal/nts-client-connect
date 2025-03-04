import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import Image from 'next/image';
import { UserRoundPen, BellRing, Building2, Shield, Menu, Sun, Moon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';

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
    const [isEditing, setIsEditing] = useState(false); // State to control editing
    const [activeSection, setActiveSection] = useState('personal'); // State to control active section
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null); // State to store user ID
    
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
                try {
                    const profilePicUrl = data.profile_picture
                        ? await getSignedUrl(data.profile_picture)
                        : 'https://www.gravatar.com/avatar?d=mp&s=100';
                    setProfilePictureUrl(profilePicUrl);
                } catch (error) {
                    console.error('Error fetching profile picture URL:', error.message);
                    setProfileError('Error fetching profile picture URL');
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
            const fullUrl = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}${profilePicturePath}`;

            const { error: updateError } = await supabase
                .from('nts_users')
                .update({ profile_picture: fullUrl })
                .eq('id', userId);

            if (updateError) {
                console.error('Error updating user profile:', updateError.message);
                setProfileError('Error updating user profile');
            } else {
                setProfileError('');
                setProfileSuccess('Profile updated successfully');
                setProfilePictureUrl(fullUrl);
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
            const profilePicUrl = profilePicturePath
                ? await getSignedUrl(profilePicturePath)
                : profilePictureUrl;
            setProfilePictureUrl(profilePicUrl);
            setIsEditing(false);
        }
    };

    const handleNotificationsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

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
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        // Re-authenticate the user with the current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: session.user.email || '',
            password: currentPassword,
        });

        if (signInError) {
            setPasswordError('Current password is incorrect');
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
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && userId) {
            updateProfilePicture(userId, file);
        }
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'tranzinc-x-0' : '-tranzinc-x-full'} transition-transform duration-300 ease-in-out w-64 bg-zinc-200 dark:bg-zinc-900 dark:text-white p-4 border-r border-t border-zinc-700/20 shadow-lg z-50 md:relative md:tranzinc-x-0`}>
                <h2 className="text-xl font-bold mb-4">Settings</h2>
                <ul className="space-y-2">
                    <li className='flex gap-1 items-center'>
                        <UserRoundPen />
                        <button
                            className={`w-full text-left p-2 ${activeSection === 'personal' ? ' bg-zinc-300 dark:text-zinc-800' : ''}`}
                            onClick={() => setActiveSection('personal')}
                        >
                            Personal Details
                        </button>
                    </li>
                    <li className='flex gap-1 items-center'>
                        <Building2 />
                        <button
                            className={`w-full text-left p-2  ${activeSection === 'company' ? ' bg-zinc-300  dark:text-zinc-800' : ''}`}
                            onClick={() => setActiveSection('company')}
                        >
                            Company Details
                        </button>
                    </li>
                    <li className='flex gap-1 items-center'>
                        <BellRing />
                        <button
                            className={`w-full text-left p-2 ${activeSection === 'notifications' ? ' bg-zinc-300 dark:text-zinc-800' : ''}`}
                            onClick={() => setActiveSection('notifications')}
                        >
                            Notification Settings
                        </button>
                    </li>
                    <li className='flex gap-1 items-center'>
                        <Shield />
                        <button
                            className={`w-full text-left p-2 ${activeSection === 'security' ? ' bg-zinc-300 dark:text-zinc-800' : ''}`}
                            onClick={() => setActiveSection('security')}
                        >
                            Security Settings
                        </button>
                    </li>
                </ul>

            </div>

            {/* Main Content */}
            <div className="flex-1 p-4">

                {/* Header */}

                <div className="flex flex-row-reverse md:flex-row justify-between items-center mb-4">
                    <button className="md:hidden btn-blue absolute z-60 top-0 left-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu className="h-6 w-6" />
                    </button>
                    <h1 className="text-2xl xs:pr-8  text-center w-full font-bold">
                        {activeSection === 'personal' && 'Personal Details'}
                        {activeSection === 'company' && 'Company Details'}
                        {activeSection === 'notifications' && 'Notification Settings'}
                        {activeSection === 'security' && 'Security Settings'}
                    </h1>

                </div>

                {activeSection === 'personal' && (
                    <div className=' flex flex-col w-full lg:w-1/2 md:items-center justify-center'>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="body-btn"
                            disabled={isEditing}
                        >
                            Edit Profile Information
                        </button>
                        <div className="flex flex-col gap-4 bg-stone-200 dark:text-zinc-800 px-12 pt-6 pb-12 border border-zinc-600/40 shadow-sm rounded-sm">
                            <form onSubmit={handleProfileSubmit} className="flex flex-col justify-center items-center gap-4 w-full">
                                {profilePictureUrl && (
                                    <div className="flex flex-col items-center">
                                        <Image
                                            src={profilePictureUrl}
                                            alt="Profile Picture"
                                            width={100}
                                            height={100}
                                            className="rounded-full shadow-md self-center"
                                        />
                                        <div className='w-full flex flex-col items-center justify-center mt-3 mb-6'>
                                            <label className='font-semibold text-zinc-800 dark:text-zinc-800'>Update Profile Image</label>
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="profile-picture-upload"
                                                disabled={!isEditing}
                                            />
                                            <label
                                                htmlFor="profile-picture-upload"
                                                className={`body-btn cursor-pointer ${!isEditing ? 'opacity-50 dark:text-zinc-100 dark:bg-zinc-900 cursor-not-allowed' : ''}`}
                                            >
                                                Upload Image
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className='lg:flex justify-center items-center gap-2'>
                                    <div className="flex flex-col">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                            className="rounded w-full p-2 border border-zinc-900"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                            className="rounded w-full p-2 border border-zinc-900"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>

                                <div className='lg:flex justify-center items-center gap-2'>
                                    <div className="flex flex-col">
                                        <label>Phone Number</label>
                                        <input
                                            type="text"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="rounded w-full p-2 border border-zinc-900"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="rounded w-full p-2 border border-zinc-900"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <button type="submit" className="body-btn" disabled={!isEditing}>
                                        Update Profile
                                    </button>
                                </div>
                                {profileError && <p className="text-red-500 col-span-2">{profileError}</p>}
                                {profileSuccess && <p className="text-green-500 col-span-2">{profileSuccess}</p>}
                            </form>
                        </div>
                    </div>
                )}

                {activeSection === 'company' && (
                    <div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="body-btn my-4 text-nowrap flex-nowrap cursor-pointer self-start"
                            disabled={isEditing}
                        >
                            Edit Company Information
                        </button>
                        <div className="flex flex-col w-full lg:w-1/2 md:items-center justify-center gap-4 bg-stone-100 px-12 pt-6 pb-12 border border-zinc-600/40 shadow-sm rounded-sm">
                            <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full dark:text-zinc-800">
                                <div className="flex flex-col">
                                    <label>Company Name</label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="rounded w-full p-2 border border-zinc-900"
                                        disabled={!isEditing}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label>Address</label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="rounded w-full p-2 border border-zinc-900"
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <button type="submit" className="body-btn" disabled={!isEditing}>
                                        Update Company Details
                                    </button>
                                </div>
                                {profileError && <p className="text-red-500 col-span-2">{profileError}</p>}
                                {profileSuccess && <p className="text-green-500 col-span-2">{profileSuccess}</p>}
                            </form>
                        </div>
                    </div>
                )}

                {activeSection === 'notifications' && (
                    <div>
                        <div className="flex flex-col w-full lg:w-1/2 md:items-center justify-center  gap-4 bg-stone-100 px-12 pt-6 pb-12 border border-zinc-600/40 shadow-sm rounded-sm">
                            <form onSubmit={handleNotificationsSubmit} className="flex flex-col gap-4 w-full dark:text-zinc-800">
                                <div className='flex items-center gap-1 flex-nowrap'>
                                    <label className='text-lg font-medium'>Email Notifications</label>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={emailNotifications}
                                            onChange={(e) => setEmailNotifications(e.target.checked)}
                                            disabled={!isEditing}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>

                                <button type="submit" className="body-btn" disabled={!isEditing}>
                                    Update Notification Settings
                                </button>
                                {notificationsError && <p className="text-red-500">{notificationsError}</p>}
                                {notificationsSuccess && <p className="text-green-500">{notificationsSuccess}</p>}
                            </form>
                        </div>
                    </div>
                )}

                {activeSection === 'security' && (
                    <div>
                        <div className="flex flex-col w-full lg:w-1/2 md:items-center justify-center gap-4 bg-stone-100 px-12 pt-6 pb-12 border border-zinc-600/40 shadow-sm rounded-sm">
                            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 w-full dark:text-zinc-800">
                                <h2 className='font-bold'>Change Password</h2>
                                <div className="flex flex-col">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        className="rounded w-full p-2 border border-zinc-900"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="rounded w-full p-2 border border-zinc-900"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="rounded w-full p-2 border border-zinc-900"
                                    />
                                </div>

                                <button type="submit" className="body-btn">
                                    Update Password
                                </button>
                                {passwordError && <p className="text-red-500">{passwordError}</p>}
                                {passwordSuccess && <p className="text-green-500">{passwordSuccess}</p>}
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NtsSettings;