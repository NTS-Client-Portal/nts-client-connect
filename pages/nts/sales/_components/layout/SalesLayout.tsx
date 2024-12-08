import React, { ReactNode, useState, useEffect } from 'react';
import SalesSideNav from './SalesSideNav';
import SalesTopNav from './SalesTopNav';
import { useSession } from '@supabase/auth-helpers-react';

interface SalesLayoutProps {
    children: ReactNode;
}

const SalesLayout: React.FC<SalesLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const session = useSession();

    useEffect(() => {
        // Check if the screen size is large enough to display the sidebar by default
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        if (mediaQuery.matches) {
            setIsSidebarOpen(true);
        }

        // Add a listener to update the state if the screen size changes
        const handleMediaQueryChange = (e: MediaQueryListEvent) => {
            setIsSidebarOpen(e.matches);
        };

        mediaQuery.addEventListener('change', handleMediaQueryChange);

        // Clean up the event listener on component unmount
        return () => {
            mediaQuery.removeEventListener('change', handleMediaQueryChange);
        };
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="md:layout">
            <SalesSideNav
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
            />
            <div className="w-full fixed top-0 left-0">
                <SalesTopNav session={session} />
            </div>
            <main className="ml-0 mt-32 md:mt-20 xl:ml-52 p-4 z-0 relative">
                {children}
            </main>
        </div>
    );
};

export default SalesLayout;