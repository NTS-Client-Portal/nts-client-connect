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
    }, [userProfile, supabase]);


    return (
        <ProfilesUserProvider>
            <div className="nts-app-container">
                {/* Desktop Layout - Modern Architecture */}
                <div className="nts-desktop-layout">
                    {/* Sidebar */}
                    <aside className={`nts-sidebar ${isSidebarOpen ? 'nts-sidebar--open' : 'nts-sidebar--closed'}`}>
                        <UserSideNav
                            isSidebarOpen={isSidebarOpen}
                            toggleSidebar={toggleSidebar}
                            className=""
                            isDesktop={true}
                        />
                    </aside>

                    {/* Main Content Wrapper */}
                    <div className={`nts-main-wrapper ${isSidebarOpen ? 'nts-main-wrapper--shifted' : ''}`}>
                        {/* Top Navigation */}
                        <UserTopNav className="sticky top-0 z-30" toggleSidebar={toggleSidebar} />
                        
                        {/* Main Content */}
                        <main className="nts-main-content">
                            <div className="nts-content-container">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>

                {/* Mobile Sidebar Overlay */}
                <div className={`nts-mobile-overlay ${isSidebarOpen ? 'nts-mobile-overlay--visible' : ''}`}>
                    <div className="nts-mobile-backdrop" onClick={toggleSidebar}></div>
                    <aside className="nts-mobile-sidebar">
                        <UserSideNav
                            isSidebarOpen={isSidebarOpen}
                            toggleSidebar={toggleSidebar}
                            className=""
                            isDesktop={false}
                        />
                    </aside>
                </div>
            </div>
        </ProfilesUserProvider>
    );
};

export default UserLayout;