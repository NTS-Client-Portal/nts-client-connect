import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import AdminAnalytics from '@components/admin/AdminAnalytics';

type Profile = Database['public']['Tables']['profiles']['Row'];

const SuperadminDashboard = () => {
    const supabase = useSupabaseClient<Database>();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newProfile, setNewProfile] = useState<Partial<Profile>>({});

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            setError(error.message);
        } else {
            setProfiles(data);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const handleDelete = async (id: string) => {
        setLoading(true);
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) {
            setError(error.message);
        } else {
            fetchProfiles();
        }
        setLoading(false);
    };

    const handleAddProfile = async () => {
        setLoading(true);
        const { error } = await supabase.from('profiles').insert([{ ...newProfile, id: crypto.randomUUID() }]);
        if (error) {
            setError(error.message);
        } else {
            fetchProfiles();
            setNewProfile({});
        }
        setLoading(false);
    };

    const handleEditProfile = async (id: string, updatedProfile: Partial<Profile>) => {
        setLoading(true);
        const { error } = await supabase.from('profiles').update(updatedProfile).eq('id', id);
        if (error) {
            setError(error.message);
        } else {
            fetchProfiles();
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Superadmin Dashboard</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <AdminAnalytics />
            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">Profiles</h2>
                <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
                    <thead className="bg-gray-200">
                        <tr>
                            {profiles.length > 0 &&
                                Object.keys(profiles[0]).map((key) => (
                                    <th key={key} className="py-2 px-4 text-left">{key}</th>
                                ))}
                            <th className="py-2 px-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.map((profile) => (
                            <tr key={profile.id} className="border-t">
                                {Object.entries(profile).map(([key, value]) => (
                                    <td key={key} className="py-2 px-4">{String(value)}</td>
                                ))}
                                <td className="py-2 px-4">
                                    <button
                                        onClick={() => handleDelete(profile.id)}
                                        className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition duration-200 mr-2"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => handleEditProfile(profile.id, profile)}
                                        className="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition duration-200"
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Add New Profile</h3>
                    {profiles.length > 0 &&
                        Object.keys(profiles[0]).map((key) => (
                            <div key={key} className="mb-4">
                                <label className="block text-gray-700">{key}</label>
                                <input
                                    type="text"
                                    value={newProfile[key] || ''}
                                    onChange={(e) =>
                                        setNewProfile({ ...newProfile, [key]: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                    <button
                        onClick={handleAddProfile}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
                    >
                        Add Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuperadminDashboard;