import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Profile, NtsUser } from '@/lib/schema'; // Import the Profile and NtsUser types from schema.ts

interface UserContextType {
    userProfile: Profile | NtsUser | null;
    setUserProfile: React.Dispatch<React.SetStateAction<Profile | NtsUser | null>>;
    loading: boolean;
    error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const [userProfile, setUserProfile] = useState<Profile | NtsUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!session) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('nts_users')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.error('No profile found for user');
                } else {
                    console.error('Error fetching user profile:', error.message);
                }
                setError('Error fetching user profile');
            } else {
                console.log('Fetched user profile:', data);
                setUserProfile(data);
            }

            setLoading(false);
        };

        if (session) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, [session, supabase]);

    return (
        <UserContext.Provider value={{ userProfile, setUserProfile, loading, error }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};