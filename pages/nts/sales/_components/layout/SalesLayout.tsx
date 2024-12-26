import React, { ReactNode, useState, useEffect } from 'react';
import SalesSideNav from './SalesSideNav';
import SalesTopNav from './SalesTopNav';
import { useSession } from '@supabase/auth-helpers-react';
import { NtsUsersProvider, useNtsUsers } from '@/context/NtsUsersContext';
import ChatRequestListener from '@components/ChatRequestListener';

interface SalesLayoutProps {
    children: ReactNode;
}

const SalesLayout: React.FC<SalesLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const session = useSession();
    const { userProfile } = useNtsUsers();

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

    return (
        <NtsUsersProvider>
            <div className="md:layout">
                <SalesSideNav
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                />
                <div className="w-full bg-white absolute z-30 top-0 left-0">
                    <SalesTopNav session={session} />
                </div>
                <main className="ml-0 mt-32 md:mt-20 xl:ml-52 p-4 z-0 relative">
                    {userProfile && session && (
                        <ChatRequestListener />
                    )}
                    {children}
                </main>
            </div>
        </NtsUsersProvider>
    );
};

export default SalesLayout;