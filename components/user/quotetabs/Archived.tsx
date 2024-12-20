import React, { useEffect, useState } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/initSupabase';

interface ArchivedProps {
    session: Session | null;
}

const Archived: React.FC<ArchivedProps> = ({ session }) => {
    const [errorText, setErrorText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [archivedQuotes, setArchivedQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);

    useEffect(() => {
        const fetchArchivedQuotes = async () => {
            if (!session?.user?.id) return;

            const { data, error } = await supabase
                .from('shippingquotes')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('is_archived', true);

            if (error) {
                console.error('Error fetching archived quotes:', error.message);
                setErrorText('Error fetching archived quotes');
            } else {
                setArchivedQuotes(data);
            }

            setIsLoading(false);
        };

        fetchArchivedQuotes();
    }, [session]);

    return (
        <div className="w-full bg-white shadow rounded-md border border-zinc-400 max-h-max flex-grow">
            {!!errorText && <div className="text-red-500">{errorText}</div>}
            <div className="hidden 2xl:block overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-ntsLightBlue font-semibold text-zinc-50 dark:bg-zinc-900/90 sticky top-0 z-10">
                        <tr className='border-b border-zinc-900/20 dark:border-zinc-100'>
                            <th className="px-2 pt-4 pb-1 text-left text-xs dark:text-zinc-50 uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">ID</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs dark:text-zinc-50 uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Origin/Destination</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs dark:text-zinc-50 uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Freight</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs dark:text-zinc-50 uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Shipping Date</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs dark:text-zinc-50 uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Contact</th>
                            <th className="px-2 pt-4 pb-1 text-left text-xs dark:text-zinc-50 uppercase tracking-wider border-r border-zinc-900/20 dark:border-zinc-100">Price</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-900/90 divide-y divide-zinc-200">
                        {archivedQuotes.map((quote) => (
                            <tr key={quote.id}>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    {quote.id}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    <div className="flex flex-col justify-start">
                                        <span><strong>Origin:</strong> {quote.origin_city ?? 'N/A'}, {quote.origin_state ?? 'N/A'} {quote.origin_zip ?? 'N/A'}</span>
                                        <span><strong>Destination:</strong> {quote.destination_city ?? 'N/A'}, {quote.destination_state ?? 'N/A'} {quote.destination_zip ?? 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    {quote.year ?? 'N/A'} {quote.make ?? 'N/A'} {quote.model ?? 'N/A'}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    {quote.due_date ?? 'No due date'}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    {quote.first_name ?? 'N/A'} {quote.last_name ?? 'N/A'} {quote.email ?? 'N/A'}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap border-r border-zinc-900/20 dark:border-zinc-100">
                                    {quote.price ? `$${quote.price}` : 'Not priced yet'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="block 2xl:hidden">
                {archivedQuotes.map((quote) => (
                    <div key={quote.id} className="bg-white shadow rounded-md mb-4 p-4 border border-zinc-400">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">ID</div>
                            <div className="text-sm text-zinc-900">{quote.id}</div>
                        </div>
                        <div className='border-b border-zinc-600 mb-4'></div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Origin</div>
                            <div className="text-sm text-zinc-900">
                                {quote.origin_city}, {quote.origin_state} {quote.origin_zip}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Destination</div>
                            <div className="text-sm text-zinc-900">{quote.destination_city}, {quote.destination_state} {quote.destination_zip}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Freight</div>
                            <div className="text-sm text-zinc-900">{quote.year} {quote.make} {quote.model}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Shipping Date</div>
                            <div className="text-sm text-zinc-900">{quote.due_date || 'No due date'}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Contact</div>
                            <div className="text-sm text-zinc-900">{quote.first_name} {quote.last_name} {quote.email}</div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-start items-stretch mb-2">
                            <div className="text-sm font-extrabold text-zinc-500">Price</div>
                            <div className="text-sm text-zinc-900">{quote.price ? `$${quote.price}` : 'Not priced yet'}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Archived;