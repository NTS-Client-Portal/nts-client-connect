import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import { useSession } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import Link from 'next/link';
import Image from 'next/image';
import { useProfilesUser } from '@/context/ProfilesUserContext';
import ShipperBrokerConnect from '@/components/ShipperBrokerConnect';
import FloatingChatWidget from '@/components/FloatingChatWidget';

type NtsUsersRow = Database['public']['Tables']['nts_users']['Row'];
type AssignedSalesUser = Database['public']['Tables']['nts_users']['Row'];

const ShipperDash = () => {
    const [errorText, setErrorText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [analytics, setAnalytics] = useState<Database | null>(null);
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [quotes, setQuotes] = useState<Database['public']['Tables']['shippingquotes']['Row'][]>([]);
    const [quoteIds, setQuoteIds] = useState<string[]>([]);
    const [assignedSalesUsers, setAssignedSalesUsers] = useState<AssignedSalesUser[]>([]);
    const [broker, setBroker] = useState<NtsUsersRow | null>(null);
    const { userProfile } = useProfilesUser();
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const session = useSession();

    useEffect(() => {
        const fetchAssignedSalesUsers = async () => {
            if (userProfile?.company_id) {
                const { data, error } = await supabase
                    .from('company_sales_users')
                    .select(`
                        sales_user_id,
                        nts_users (
                            first_name,
                            last_name,
                            email,
                            phone_number,
                            profile_picture
                        )
                    `)
                    .eq('company_id', userProfile.company_id);

                if (error) {
                    console.error('Error fetching assigned sales users:', error.message);
                } else if (data) {
                    setAssignedSalesUsers(data.map((item: any) => item.nts_users));
                }
            }
        };

        fetchAssignedSalesUsers();
    }, [userProfile]);

    useEffect(() => {
        const fetchQuotesAnalytics = async () => {
            const { data: analyticsData, error: analyticsError } = await supabase
                .from('shippingquotes')
                .select('*')
                .eq('user_id', session?.user.id)
                .neq('status', 'Quotes');

            if (analyticsError) {
                console.error('Error fetching analytics:', analyticsError.message);
                setErrorText('Error fetching analytics');
            } else {
                setAnalytics(analyticsData as any as Database);
            }

            setIsLoading(false);
        };

        if (session) {
            fetchQuotesAnalytics();
        } else {
            setIsLoading(false);
        }
    }, [session]);

    const fetchOrdersCompleted = async () => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .select('id')
            .eq('user_id', session?.user.id)
            .eq('is_completed', true);

        if (error) {
            console.error('Error fetching completed orders:', error.message);
            setErrorText('Error fetching completed orders');
            return;
        }

        setQuoteIds(data.map((quote: any) => quote.id));
    }

    const fetchPricedQuotes = async () => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('user_id', session?.user.id)
            .eq('price', Number);

        if (error) {
            console.error('Error fetching priced quotes:', error.message);
            setErrorText('Error fetching priced quotes');
            return;
        }

        setQuotes(data);
    }

    useEffect(() => {
        const fetchPricedQuotes = async () => {
            const { data, error } = await supabase
                .from('shippingquotes')
                .select('*')
                .eq('user_id', session?.user.id)
                .gt('price', 0);

            if (error) {
                console.error('Error fetching priced quotes:', error.message);
                setErrorText('Error fetching priced quotes');
                return;
            }

            setQuotes(data);
        };

        if (session) {
            fetchPricedQuotes();
        }
    }, [session]);

  const NtsBrokerPicture = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/nts_users/noah-profile.png?t=2024-12-24T23%3A54%3A10.034Z`;
    

    return (
        <div className='container mx-auto'>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <div className='flex gap-6 justify-start w-full'>
                    {assignedSalesUsers.map((user, index) => (
                        <div key={index} className="broker-card flex text-nowrap flex-col justify-center items-center p-4 bg-white shadow rounded-lg w-fit max-h-96">
                            <h2 className='text-xl underline font-bold mb-4'>Your Logistics Representative</h2>
                            <Image src={NtsBrokerPicture} alt="Profile Picture" className="avatar" width={100} height={100} />
                            <h2 className='text-xl underline font-semibold mb-4'>{user.first_name} {user.last_name}</h2>
                            <span className="flex flex-col gap-1 justify-start items-start">
                                <p><strong>Phone: </strong>{user.phone_number}</p>
                                <p><strong>Email:</strong> {user.email}</p>
                            </span>
                            {userProfile && session && (
                        <>
                            <ShipperBrokerConnect
                                brokerId={assignedSalesUsers[0]?.id || ''}
                                shipperId={userProfile.id}
                                session={session}
                            />
                            {activeChatId && (
                                <FloatingChatWidget
                                    brokerId={assignedSalesUsers[0]?.id || ''}
                                    shipperId={userProfile.id}
                                    session={session}
                                    activeChatId={activeChatId}
                                />
                            )}
                        </>
                    )}
                        </div>
                    ))}

             {quotes.length > 0 && (
                    <div className="p-4 bg-gray-100 w-1/2 shadow rounded-lg max-h-96 overflow-auto">
                        <h3 className="text-lg font-semibold mb-4">Quote Responses</h3>
                        {setQuotes ? (
                            <div className='flex flex-col gap-2'>
                               <div className=' mb-4'>
                                <Link className="body-btn" href={`/user`}>
                                  Respond
                                </Link>
                                </div>
                                <ul className='flex gap-2 flex-wrap '>
                                    {quotes.filter(quote => quote.price !== null && quote.price > 0).map((quote) => (
                                        <li key={quote.id} className="mb-2">
                                            <p>ID: {quote.id}</p>
                                            <p>Price: ${quote.price}</p>
                                            <p>Commodity: {quote.make && quote.model ? ( `${quote.make} ${quote.model}`
                                            ) : quote.container_type ? (  `${quote.container_length} ${quote.container_type}` ) : ( "N/A" )}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                                
                            </div>
                            
                        ) : (
                            <Link className="body-btn" href={`/user`}>
                                View Status
                            </Link>
                        )}
                    </div>
                )}
                </div>
            )}
            <div className='mt-4 flex gap-6 justify-start items-stretch w-full'>
                <div className="p-4 bg-gray-100 shadow rounded-lg max-w-lg max-h-96 overflow-auto">
                    <h2 className="text-xl font-bold mb-4">Active Orders</h2>
    
                        <div>
                            
                                <div>
                                    <h3 className="text-lg font-semibold"></h3>
                                    <div className='mb-2'>
                                        <ul className='flex gap-2 flex-wrap'>
                                            {quotes.map((quote) => (
                                                <li key={quote.id} className="mb-2">
                                                    <p>ID: {quote.id}</p>
                                                    <p>Status: {quote.status}</p>
                                                    <p>Commodity: {quote.make && quote.model ? ( `${quote.make} ${quote.model}`
                                                        ) : quote.container_type ? (  `${quote.container_length} ${quote.container_type}` ) : ( "N/A" )}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <Link className="body-btn mt-4" href={`/user`}>
                                    View Quotes
                                </Link>
                         
                        </div>
                   
                </div>
    
                {quotes.length > 0 && (
                    <div className="p-4 bg-gray-100 shadow rounded-lg w-1/2 max-h-96 overflow-auto">
                        <h3 className="text-lg font-semibold mb-2">Delivered Orders</h3>
                        {setQuotes ? (
                           <>
                                <div>
                                    <ul className='flex gap-2 flex-wrap'>
                                        {quotes.filter(quote => quote.price !== null && quote.price > 0).map((quote) => (
                                            <li key={quote.id} className="mb-2">
                                                <p>ID: {quote.id}</p>
                                                <p>Status: {quote.status}</p>
                                                <p>Commodity: {quote.make && quote.model ? ( `${quote.make} ${quote.model}`
                                                ) : quote.container_type ? (  `${quote.container_length} ${quote.container_type}` ) : ( "N/A" )}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                             <div className='mt-4'>
                                  <Link className="body-btn" href={`/user/documents`}>
                                     View Photos and Documents
                                 </Link>
                             </div>
                           </>
                        ) : (
                            <Link className="body-btn" href={`/user`}>
                                View Status
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ShipperDash;