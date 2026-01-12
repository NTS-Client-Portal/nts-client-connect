import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@/lib/supabase/provider';
import { NtsUser } from '@/lib/schema'; // Import the NtsUser type from schema.ts

interface NtsUsersContextType {
    userProfile: NtsUser | null;
    setUserProfile: React.Dispatch<React.SetStateAction<NtsUser | null>>;
    loading: boolean;
    error: string | null;
}

const NtsUsersContext = createContext<NtsUsersContextType | undefined>(undefined);

export const NtsUsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const [userProfile, setUserProfile] = useState<NtsUser | null>(null);
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
                    .from('nts_users')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle(); // Use maybeSingle() to handle cases where no rows are returned

                if (error) {
                    console.error('Error fetching user profile from nts_users:', error.message);
                    setError('Error fetching user profile');
                } else if (!data) {
                    console.warn('No user profile found for the given ID.');
                    setError('No user profile found');
                } else {
                    console.log('Fetched user profile from nts_users successfully:', data);
                    setUserProfile(data);
                }
            } catch (err) {
                console.error('Unexpected error fetching user profile:', err);
                setError('Unexpected error fetching user profile');
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, [session?.user?.id, supabase]); // Only depend on user ID, not full session object

    return (
        <NtsUsersContext.Provider value={{ userProfile, setUserProfile, loading, error }}>
            {children}
        </NtsUsersContext.Provider>
    );
};

export const useNtsUsers = () => {
    const context = useContext(NtsUsersContext);
    if (context === undefined) {
        throw new Error('useNtsUsers must be used within a NtsUsersProvider');
    }
    return context;
};