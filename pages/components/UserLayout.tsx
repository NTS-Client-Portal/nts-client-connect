import React, { ReactNode, useState, useEffect } from 'react';
import UserSideNav from './UserSideNav';
import UserTopNav from './UserTopNav';
import { ProfilesUserProvider, useProfilesUser } from '@/context/ProfilesUserContext';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useChat } from '@/context/ChatContext';

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
    const { activeChatId, setActiveChatId, isChatOpen, setIsChatOpen } = useChat();

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
    }, [userProfile, supabase, setActiveChatId, setIsChatOpen]);

    useEffect(() => {
        if (!userProfile) return;

        const channel = supabase
            .channel(`public:chat_requests:shipper_id=eq.${userProfile.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'chat_requests' },
                (payload: { new: { broker_id: string; accepted: boolean; id: string } }) => {
                    if (payload.new.broker_id && payload.new.accepted) {
                        setActiveChatId(payload.new.id);
                        setIsChatOpen(true);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userProfile, supabase, setActiveChatId, setIsChatOpen]);

    return (
        <ProfilesUserProvider>
            <NtsUsersProvider>
                <div className="md:layout">
                    <UserSideNav
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={toggleSidebar}
                    />
                    <div className="w-full fixed top-0 left-0 z-0">
                        <UserTopNav />
                    </div>
                    <main className="ml-0 mt-32 md:mt-24 xl:ml-52 p-4">
                        {children}
                    </main>
                </div>
            </NtsUsersProvider>
        </ProfilesUserProvider>
    );
};

export default UserLayout;