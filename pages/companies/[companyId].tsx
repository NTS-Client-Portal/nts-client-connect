import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { useSupabaseClient, Session, useSession } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import QuoteRequest from '@/components/user/QuoteRequest';
import SalesLayout from '../nts/sales/_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';

interface CompanyPageProps {
    company: any;
    profiles: any[];
    ntsUsers: any[];
    session: Session;
}

const CompanyPage: React.FC<CompanyPageProps> = ({ company, profiles, ntsUsers }) => {
    const session = useSession();
    const router = useRouter();
    const supabase = useSupabaseClient<Database>();

    if (router.isFallback) {
        return <div>Loading...</div>;
    }

    return (
        <NtsUsersProvider>
            <SalesLayout>
                <div>
                    <h1 className='font-bold text-lg'>{company.company_name}</h1>
                    <QuoteRequest session={session} profiles={profiles} ntsUsers={ntsUsers} isAdmin={false} />
                </div>
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: companies, error } = await supabase.from('companies').select('id');

    if (error) {
        console.error('Error fetching companies:', error.message);
        return { paths: [], fallback: true };
    }

    const paths = companies.map((company: any) => ({
        params: { companyId: company.id.toString() },
    }));

    return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', params?.companyId)
        .single();

    if (companyError) {
        console.error('Error fetching company:', companyError.message);
        return { notFound: true };
    }

    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', company.id);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError.message);
        return { notFound: true };
    }

    const { data: ntsUsers, error: ntsUsersError } = await supabase
        .from('nts_users')
        .select('*')
        .eq('company_id', company.id);

    if (ntsUsersError) {
        console.error('Error fetching nts_users:', ntsUsersError.message);
        return { notFound: true };
    }

    return {
        props: {
            company,
            profiles,
            ntsUsers,
        },
        revalidate: 60, // Revalidate the page every 60 seconds
    };
};

export default CompanyPage;