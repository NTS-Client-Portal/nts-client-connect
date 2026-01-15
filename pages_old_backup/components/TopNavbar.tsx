import React from 'react';
import { useSupabaseClient } from '@/lib/supabase/provider';
import Link from 'next/link';
import { MoveHorizontal } from 'lucide-react';

interface TopNavbarProps {
    className?: string;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ className }) => {
    return (
        <header className="bg-zinc-900 dark:bg-zinc-950 text-white p-4">
            <div className="md:container w-full mx-auto flex flex-col xs:justify-center md:flex-row md:justify-between items-center gap-4">
                <span className='flex mt-5 lg:mt-2 2xl:mt-0 mb-3 items-center justify-center font-bold  flex-nowrap'> <h1 className='text-lg md:mt-0  self-center font-extrabold tracking-tighter flex gap-0.5'>SHIPPER<MoveHorizontal className='size-6 text-orange-500' />CONNECT</h1></span>
                <nav className="w-full flex gap-2 justify-center md:justify-end items-center m-0">
                    <Link href="/login" className="md:ml-4 dark-light-btn">Sign In</Link>
                    <Link href="/signup" className="hidden md:block ml-4 dark-light-btn">Sign Up</Link>
                </nav>
            </div>
        </header>
    );
};

export default TopNavbar;