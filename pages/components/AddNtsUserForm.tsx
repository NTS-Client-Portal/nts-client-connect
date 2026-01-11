import React, { useState } from 'react';
import { supabase } from '@/lib/initSupabase';
import { Database } from '@/lib/database.types';
import { useSession, useSupabaseClient } from '@/lib/supabase/provider';
import Image from 'next/image';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  Camera, 
  AlertCircle, 
  CheckCircle2,
  UserPlus,
  Loader2
} from 'lucide-react';

interface AddNtsUserFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    ntsUsers: Database['public']['Tables']['nts_users']['Row'][];
}

type NtsUser = Database['public']['Tables']['nts_users']['Row'];

const AddNtsUserForm: React.FC<AddNtsUserFormProps> = ({ isOpen, onClose, onSuccess, ntsUsers }) => {
    const session = useSession();
    const [newNtsUser, setNewNtsUser] = useState<Partial<NtsUser>>({
        role: 'sales', // Set default role here
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);

    const allowedFields = ['email', 'role', 'first_name', 'last_name', 'phone_number', 'extension', 'office'];

    const handleAddNtsUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!newNtsUser.email) {
            setError('Email is required');
            return;
        }
        if (!newNtsUser.role) {
            setError('Role is required');
            return;
        }
        if (!newNtsUser.first_name) {
            setError('First name is required');
            return;
        }
        if (!newNtsUser.last_name) {
            setError('Last name is required');
            return;
        }

        setLoading(true);

        try {
            let profilePictureUrl = null;

            // Upload profile picture first if provided
            if (profilePicture) {
                const { data, error: uploadError } = await supabase
                    .storage
                    .from('profile-pictures')
                    .upload(`public/${profilePicture.name}`, profilePicture, {
                        cacheControl: '3600',
                        upsert: true,
                    });

                if (uploadError) {
                    if (uploadError.message.includes('The resource already exists')) {
                        const { data: existingFileData } = await supabase
                            .storage
                            .from('profile-pictures')
                            .getPublicUrl(`public/${profilePicture.name}`);
                        profilePictureUrl = existingFileData.publicUrl;
                    } else {
                        throw new Error(uploadError.message);
                    }
                } else {
                    const { data: newFileData } = await supabase
                        .storage
                        .from('profile-pictures')
                        .getPublicUrl(data.path);
                    profilePictureUrl = newFileData.publicUrl;
                }
            }

            // Use the new API endpoint that bypasses OTP verification
            const response = await fetch('/api/admin/create-nts-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: newNtsUser.email,
                    role: newNtsUser.role,
                    first_name: newNtsUser.first_name,
                    last_name: newNtsUser.last_name,
                    phone_number: newNtsUser.phone_number,
                    extension: newNtsUser.extension,
                    office: newNtsUser.office,
                    profile_picture: profilePictureUrl,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create NTS user');
            }

            // Show success message with temporary password info
            alert(`NTS User created successfully!\n\nTemporary Password: ${result.temporary_password}\n\nA password reset email has been sent to ${newNtsUser.email} so they can set their own password.`);

            setNewNtsUser({ role: 'sales' });
            setProfilePicture(null);
            onClose();
            onSuccess();
        } catch (error) {
            console.error('Error adding NTS User:', error);
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-linear-to-r from-blue-600 to-purple-600 px-8 py-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <UserPlus className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">Add New NTS User</h3>
                            <p className="text-blue-100">Create a new internal team member account</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleAddNtsUser} className="space-y-8">
                        {/* Personal Information Section */}
                        <div>
                            <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                                <User className="h-5 w-5 text-blue-600" />
                                <span>Personal Information</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newNtsUser.first_name || ''}
                                        onChange={(e) =>
                                            setNewNtsUser({ ...newNtsUser, first_name: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400"
                                        placeholder="Enter first name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newNtsUser.last_name || ''}
                                        onChange={(e) =>
                                            setNewNtsUser({ ...newNtsUser, last_name: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400"
                                        placeholder="Enter last name"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Information Section */}
                        <div>
                            <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                                <Mail className="h-5 w-5 text-blue-600" />
                                <span>Contact Information</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        value={newNtsUser.email || ''}
                                        onChange={(e) =>
                                            setNewNtsUser({ ...newNtsUser, email: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400"
                                        placeholder="user@ntslogistics.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Phone Number
                                    </label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="tel"
                                            value={newNtsUser.phone_number || ''}
                                            onChange={(e) =>
                                                setNewNtsUser({ ...newNtsUser, phone_number: e.target.value })
                                            }
                                            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400"
                                            placeholder="(555) 123-4567"
                                        />
                                        <input
                                            type="text"
                                            value={newNtsUser.extension || ''}
                                            onChange={(e) =>
                                                setNewNtsUser({ ...newNtsUser, extension: e.target.value })
                                            }
                                            className="w-24 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400"
                                            placeholder="Ext"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Role & Office Section */}
                        <div>
                            <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                <span>Role & Office</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Role *
                                    </label>
                                    <select
                                        value={newNtsUser.role || 'sales'}
                                        onChange={(e) =>
                                            setNewNtsUser({ ...newNtsUser, role: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 bg-white"
                                        required
                                    >
                                        <option value="sales">Sales Representative</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Administrator</option>
                                        <option value="super_admin">Super Administrator</option>
                                        <option value="support">Support</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Office Location
                                    </label>
                                    <select
                                        value={newNtsUser.office || ''}
                                        onChange={(e) =>
                                            setNewNtsUser({ ...newNtsUser, office: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 bg-white"
                                    >
                                        <option value="">Select Office</option>
                                        <option value="Florence, KY">Florence, KY</option>
                                        <option value="Fort Lauderdale, FL">Fort Lauderdale, FL</option>
                                        <option value="Fort Myers, FL">Fort Myers, FL</option>
                                        <option value="Fort Pierce, FL">Fort Pierce, FL</option>
                                        <option value="Doral, FL">Doral, FL</option>
                                        <option value="Orlando, FL">Orlando, FL</option>
                                        <option value="Tampa, FL">Tampa, FL</option>
                                        <option value="West Palm Beach, FL">West Palm Beach, FL</option>
                                        <option value="Jacksonville, FL">Jacksonville, FL</option>
                                        <option value="Cleveland, Ohio">Cleveland, Ohio</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Profile Picture Section */}
                        <div>
                            <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                                <Camera className="h-5 w-5 text-blue-600" />
                                <span>Profile Picture (Optional)</span>
                            </h4>
                            <div className="flex items-start space-x-6">
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setProfilePicture(e.target.files ? e.target.files[0] : null)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                                    />
                                    <p className="text-sm text-slate-500 mt-2">
                                        Upload a profile picture (JPG, PNG, or GIF)
                                    </p>
                                </div>
                                {profilePicture && (
                                    <div className="shrink-0">
                                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-300">
                                            <Image
                                                src={URL.createObjectURL(profilePicture)}
                                                alt="Profile Preview"
                                                width={96}
                                                height={96}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    loading
                                        ? 'bg-slate-400 text-white cursor-not-allowed'
                                        : 'bg-linear-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg transform hover:scale-105'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center space-x-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Creating User...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <UserPlus className="h-5 w-5" />
                                        <span>Create NTS User</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddNtsUserForm;