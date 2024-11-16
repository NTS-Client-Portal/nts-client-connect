import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface UserProfile {
    id: string;
    email: string;
    role: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    profile_picture: string | null;
    address: string | null;
    phone_number: string | null;
    team_role: string | null;
}

interface UserContextType {
    userProfile: UserProfile | null;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    loading: boolean;
    error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const session = useSession();
    const supabase = useSupabaseClient<Database>();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!session) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, role, first_name, last_name, company_name, profile_picture, address, phone_number, team_role')
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