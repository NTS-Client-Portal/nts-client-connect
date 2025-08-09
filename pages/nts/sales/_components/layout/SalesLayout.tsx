import React, { ReactNode, useState, useEffect } from 'react';
import SalesSideNav from './SalesSideNav';
import SalesTopNav from './SalesTopNav';
import { useSession } from '@supabase/auth-helpers-react';
import { useNtsUsers } from '@/context/NtsUsersContext';

interface SalesLayoutProps {
    children: ReactNode;
}

const SalesLayout: React.FC<SalesLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const session = useSession();
    const { userProfile } = useNtsUsers();

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1280px)'); // xl breakpoint
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Flex Container - Force side-by-side layout */}
            <div className="flex min-h-screen">
                {/* Desktop Sidebar - Fixed width */}
                {isSidebarOpen && (
                    <div className="hidden xl:block xl:w-48 xl:flex-shrink-0 z-[10]">
                        <SalesSideNav
                            isSidebarOpen={isSidebarOpen}
                            toggleSidebar={toggleSidebar}
                            isDesktop={true}
                        />
                    </div>
                )}
                
                {/* Main Content Area - Takes remaining space */}
                <div className="flex-1 flex flex-col min-h-screen xl:min-h-0 min-w-0">
                    {/* Top Navigation */}
                    <div className="fixed top-0 left-0 right-0  xl:relative xl:left-0">
                        <SalesTopNav 
                            session={session} 
                            isSidebarOpen={isSidebarOpen}
                            toggleSidebar={toggleSidebar}
                        />
                    </div>
                    
                    {/* Main Content */}
                    <main className="flex-1 pt-16 xl:pt-0 overflow-auto w-full m-0 p-9">
                        <div className="w-full h-full m-0 p-0">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
            
            {/* Mobile Sidebar - Outside flex, overlay */}
            <div className="xl:hidden">
                <SalesSideNav
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    isDesktop={false}
                />
            </div>
        </div>
    );
};

export default SalesLayout;