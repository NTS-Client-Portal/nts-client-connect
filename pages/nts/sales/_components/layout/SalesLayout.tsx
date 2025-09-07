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
    const [isDesktop, setIsDesktop] = useState(false);
    const [mounted, setMounted] = useState(false);
    const session = useSession();
    const { userProfile } = useNtsUsers();

    useEffect(() => {
        setMounted(true);
        const mediaQuery = window.matchMedia('(min-width: 1024px)'); // lg breakpoint
        setIsDesktop(mediaQuery.matches);
        if (mediaQuery.matches) {
            setIsSidebarOpen(true);
        }

        const handleMediaQueryChange = (e: MediaQueryListEvent) => {
            setIsDesktop(e.matches);
            setIsSidebarOpen(e.matches);
        };

        mediaQuery.addEventListener('change', handleMediaQueryChange);

        return () => {
            mediaQuery.removeEventListener('change', handleMediaQueryChange);
        };
    }, []);

    // Prevent hydration issues
    if (!mounted) {
        return <div>Loading...</div>;
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="nts-app-container">
            {/* Desktop Layout - Modern Architecture */}
            <div className="nts-desktop-layout">
                {/* Sidebar */}
                <aside className={`nts-sidebar ${isSidebarOpen ? 'nts-sidebar--open' : 'nts-sidebar--closed'}`}>
                    <SalesSideNav
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={toggleSidebar}
                        isDesktop={isDesktop}
                    />
                </aside>

                {/* Main Content Wrapper */}
                <div className={`nts-main-wrapper ${isSidebarOpen ? 'nts-main-wrapper--shifted' : ''}`}>
                    {/* Top Navigation */}
                    <header className="nts-topnav">
                        <SalesTopNav 
                            session={session} 
                            isSidebarOpen={isSidebarOpen}
                            toggleSidebar={toggleSidebar}
                        />
                    </header>

                    {/* Main Content */}
                    <main className="nts-main-content">
                        <div className="nts-content-container">
                            {children}
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile Sidebar Overlay - Only show on mobile */}
            {!isDesktop && (
                <div className={`nts-mobile-overlay ${isSidebarOpen ? 'nts-mobile-overlay--visible' : ''}`}>
                    <div className="nts-mobile-backdrop" onClick={toggleSidebar}></div>
                    <aside className="nts-mobile-sidebar">
                        <SalesSideNav
                            isSidebarOpen={isSidebarOpen}
                            toggleSidebar={toggleSidebar}
                            isDesktop={false}
                        />
                    </aside>
                </div>
            )}
        </div>
    );
};

export default SalesLayout;