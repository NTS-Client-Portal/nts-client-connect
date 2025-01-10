import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';

interface NtsUser {
    id: string;
    email: string;
    // Remove profileType property
    address: string | null;
    auth_uid: string | null;
    company_id: string | null;
    email_notifications: boolean | null;
    extension: string | null;
    first_name: string | null;
    inserted_at: string;
    last_name: string | null;
    phone_number: string | null;
    role: string;
    profile_picture: string | null;
}

interface NtsUsersContextType {
    userProfile: NtsUser | null;
    loading: boolean;
    error: string | null;
}

const NtsUsersContext = createContext<NtsUsersContextType | undefined>(undefined);

export const NtsUsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userProfile, setUserProfile] = useState<NtsUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            const { data, error } = await supabase.auth.getUser();
            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            const user = data?.user;
            if (user) {
                const { data: profile, error: profileError } = await supabase
                    .from('nts_users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    setError(profileError.message);
                } else {
                    setUserProfile(profile);
                }
            }
            setLoading(false);
        };

        fetchUserProfile();
    }, []);

    return (
        <NtsUsersContext.Provider value={{ userProfile, loading, error }}>
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