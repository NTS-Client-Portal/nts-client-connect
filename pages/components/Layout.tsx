import React, { useState, useEffect } from 'react';
import SideNavbar from './SideNavbar'; // Adjust the import path as needed

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        if (mediaQuery.matches) {
            setIsSidebarOpen(true);
        }

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
                <SideNavbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <main className="main-content z-0 p-4 mt-20 relative">
                    {children}
                </main>
        </div>
    );
};

export default Layout;