import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface ProfilesUserContextType {
    userProfile: Database['public']['Tables']['profiles']['Row'] | null;
    setUserProfile: React.Dispatch<React.SetStateAction<Database['public']['Tables']['profiles']['Row'] | null>>;
    loading: boolean;
    error: string | null;
}

const ProfilesUserContext = createContext<ProfilesUserContextType | undefined>(undefined);

export const ProfilesUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const session = useSession();
    const supabase = useSupabaseClient<Database>();
    const [userProfile, setUserProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!session) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching user profile from profiles:', error.message);
                    setError('Error fetching user profile');
                } else if (!data) {
                    console.warn('No user profile found for the given ID.');
                    setError('No user profile found');
                } else {
                    console.log('Fetched user profile from profiles successfully:', data);
                    setUserProfile(data);
                }
            } catch (err) {
                console.error('Unexpected error fetching user profile:', err);
                setError('Unexpected error fetching user profile');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [session, supabase]);

    return (
        <ProfilesUserContext.Provider value={{ userProfile, setUserProfile, loading, error }}>
            {children}
        </ProfilesUserContext.Provider>
    );
};

export const useProfilesUser = () => {
    const context = useContext(ProfilesUserContext);
    if (context === undefined) {
        throw new Error('useProfilesUser must be used within a ProfilesUserProvider');
    }
    return context;
};