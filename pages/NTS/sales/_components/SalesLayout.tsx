import React, { ReactNode, useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import SalesSideNav from './SalesSideNav'; // Adjust the import path if necessary
import SalesTopNav from './SalesTopNav'; // Adjust the import path if necessary

interface SalesLayoutProps {
    children: ReactNode;
}

const SalesLayout: React.FC<SalesLayoutProps> = ({ children }) => {
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
            <div className='z-40'><SalesSideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} /></div>

            <main className="main-content ml-0 xl:ml-52 z-0 md:p-4 mt-28 md:mt-24 relative">
                <div className="w-full fixed top-0 left-0">
                    <SalesTopNav session={session} />
                </div>
                {children}
            </main>
        </div>
    );
};

export default SalesLayout;