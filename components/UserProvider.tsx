import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface UserProfile {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    address: string | null;
    phone_number: string | null;
    profile_picture: string | null;
    role: string;
}

interface UserContextProps {
    userProfile: UserProfile | null;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    loading: boolean;
    error: string | null;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

interface UserProviderProps {
    session: Session;
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ session, children }) => {
    const supabase = useSupabaseClient<Database>();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!session) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, first_name, last_name, company_name, address, phone_number, profile_picture, role, team_role')
                .eq('id', session.user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.error('No user profile found for the given ID.');
                    setError('No user profile found for the given ID.');
                } else {
                    console.error('Error fetching profile:', error.message);
                    setError('Error fetching profile');
                }
            } else {
                if (data && !('error' in data)) {
                    setUserProfile(data as UserProfile);
                } else {
                    setError('Invalid user profile data');
                }
            }

            setLoading(false);
        };

        if (session) {
            fetchProfile();
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