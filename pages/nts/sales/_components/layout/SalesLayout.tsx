import React, { ReactNode, useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import SalesSideNav from './SalesSideNav'; // Adjust the import path if necessary
import SalesTopNav from './SalesTopNav'; // Adjust the import path if necessary

interface SalesLayoutProps {
    children: ReactNode;
    currentView: string;
    setCurrentView: (view: string) => void;
}

const SalesLayout: React.FC<SalesLayoutProps> = ({ children, currentView, setCurrentView }) => {
    const session = useSession();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                currentView={currentView}
                setCurrentView={setCurrentView}
            />
            <div className="w-full fixed top-0 left-0">
                <SalesTopNav session={session} />
            </div>
            <main className="ml-0 xl:ml-52 md:p-4 mt-12 z-0 md:mt-12 relative">
                {children}
            </main>
        </div>
    );
};

export default SalesLayout;