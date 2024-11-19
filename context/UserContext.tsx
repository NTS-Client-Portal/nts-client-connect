import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Profile } from '@/lib/schema'; // Import the Profile type from schema.ts

interface UserContextType {
    userProfile: Profile | null;
    setUserProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
    loading: boolean;
    error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const session = useSession();
    const supabase = useSupabaseClient();
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
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
                .select(`
                    id, email, role, first_name, last_name, company_name, profile_picture, address, phone_number, team_role,
                    company_id, company_size, email_notifications, inserted_at, profile_complete,
                    assigned_sales_user:profiles!companies_assigned_sales_user_fkey ( id, first_name, last_name, email )
                `)
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
                if (data) {
                    const userProfile: Profile = {
                        ...data,
                        assigned_sales_user: data.assigned_sales_user ? data.assigned_sales_user[0] : null,
                    };
                    setUserProfile(userProfile);
                }
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