import React from 'react';
import { FolderHeart, Folder, X } from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen, activeSection, setActiveSection }) => {
    return (
        <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out w-64 bg-zinc-200 dark:bg-zinc-900 dark:text-white p-4 border-r border-t border-zinc-700/20 shadow-lg z-50 md:relative md:translate-x-0 h-screen`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Documents</h2>
                <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
                    <X className="h-6 w-6" />
                </button>
            </div>
            <ul className="space-y-2">
                <li className='flex gap-1 items-center'>
                    <Folder />
                    <button
                        className={`w-full text-left p-2 ${activeSection === 'all' ? 'bg-zinc-100 dark:text-zinc-800' : ''}`}
                        onClick={() => setActiveSection('all')}
                    >
                        All Documents
                    </button>
                </li>
                <li className='flex gap-1 items-center'>
                    <FolderHeart />
                    <button
                        className={`w-full text-left p-2 ${activeSection === 'important' ? 'bg-zinc-100 dark:text-zinc-800' : ''}`}
                        onClick={() => setActiveSection('important')}
                    >
                        Important
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;