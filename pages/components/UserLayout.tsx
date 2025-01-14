import React, { ReactNode, useState, useEffect } from 'react';
import UserSideNav from './UserSideNav';
import UserTopNav from './UserTopNav';
import { ProfilesUserProvider, useProfilesUser } from '@/context/ProfilesUserContext';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

interface UserLayoutProps {
    children: ReactNode;
}

interface AssignedSalesUser {
    id: string;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [assignedSalesUsers, setAssignedSalesUsers] = useState<AssignedSalesUser[]>([]);
    const session = useSession();
    const supabase = useSupabaseClient();
    const { userProfile } = useProfilesUser();

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        if (mediaQuery.matches) {
            setIsSidebarOpen(true);
        }

        const handleMediaQueryChange = (e: MediaQueryListEvent) => {
            setIsSidebarOpen(e.matches);
        };

        mediaQuery.addEventListener('change', handleMediaQueryChange);

        return () => {
            mediaQuery.removeEventListener('change', handleMediaQueryChange);
        };
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        const fetchAssignedSalesUsers = async () => {
            if (userProfile?.company_id) {
                const { data, error } = await supabase
                    .from('company_sales_users')
                    .select(`
                        sales_user_id,
                        nts_users (
                            id
                        )
                    `)
                    .eq('company_id', userProfile.company_id);

                if (error) {
                    console.error('Error fetching assigned sales users:', error.message);
                } else if (data) {
                    setAssignedSalesUsers(data.map((item: any) => item.nts_users));
                }
            }
        };

        fetchAssignedSalesUsers();
    }, [userProfile, supabase ]);


    return (
        <ProfilesUserProvider>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[200px_1fr] min-h-screen">
                <UserSideNav
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    className="col-span-1"
                />
                <div className="fixed w-full top-0 left-0 z-10">
                    <UserTopNav
                    />
                </div>
                <div className="col-span-1">

                    <main className="mt-12 md:mt-20 p-4">
                        {children}
                    </main>
                </div>
            </div>
        </ProfilesUserProvider>
    );
};

export default UserLayout;