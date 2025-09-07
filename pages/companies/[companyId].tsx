import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import SalesLayout from '../nts/sales/_components/layout/SalesLayout';
import QuoteRequest from '@/components/user/QuoteRequest';

interface Company {
  id: string;
  name: string;
  [key: string]: any;
}

interface Profile {
  id: string;
  company_id: string;
  [key: string]: any;
}

const CompanyPage: React.FC = () => {
    const router = useRouter();
    const session = useSession();
    const supabase = useSupabaseClient<Database>();
    const { companyId } = router.query;

    const [company, setCompany] = useState<Company | null>(null);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!companyId || !session || typeof companyId !== 'string') return;

        const fetchCompanyData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch company data
                const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', companyId as string)
                    .single();

                if (companyError) {
                    throw new Error(`Error fetching company: ${companyError.message}`);
                }

                // Fetch profiles for this company
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('company_id', companyId as string);

                if (profilesError) {
                    throw new Error(`Error fetching profiles: ${profilesError.message}`);
                }

                setCompany(companyData);
                setProfiles(profilesData || []);
            } catch (err) {
                console.error('Error fetching company data:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyData();
    }, [companyId, session, supabase]);

    if (loading) {
        return (
            <NtsUsersProvider>
                <SalesLayout>
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </SalesLayout>
            </NtsUsersProvider>
        );
    }

    if (error) {
        return (
            <NtsUsersProvider>
                <SalesLayout>
                    <div className="text-center py-12">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                        <p className="text-gray-600">{error}</p>
                        <button 
                            onClick={() => router.back()}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Go Back
                        </button>
                    </div>
                </SalesLayout>
            </NtsUsersProvider>
        );
    }

    if (!company) {
        return (
            <NtsUsersProvider>
                <SalesLayout>
                    <div className="text-center py-12">
                        <h1 className="text-2xl font-bold text-gray-600 mb-4">Company Not Found</h1>
                        <button 
                            onClick={() => router.back()}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Go Back
                        </button>
                    </div>
                </SalesLayout>
            </NtsUsersProvider>
        );
    }

    return (
        <NtsUsersProvider>
            <SalesLayout>
                <div>
                    <h1 className='sm:text-center md:text-start md:p-3 font-bold text-lg'>{company.name}</h1>
                    <QuoteRequest 
                        session={session} 
                        profiles={profiles as any} 
                        companyId={company.id} 
                        userType='broker' 
                    />
                </div>
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default CompanyPage;