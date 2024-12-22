import React from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@supabase/auth-helpers-react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import SalesLayout from '../nts/sales/_components/layout/SalesLayout';
import QuoteRequest from '@/components/user/QuoteRequest';

const CompanyPage: React.FC<{ company: any; profiles: any[]; ntsUsers: any[] }> = ({ company, profiles, ntsUsers }) => {
    const router = useRouter();
    const session = useSession();

    if (router.isFallback) {
        return <div>Loading...</div>;
    }

    return (
        <NtsUsersProvider>
            <SalesLayout session={null}>
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

    const paths = companies.map((company: { id: string }) => ({
        params: { companyId: company.id },
    }));

    return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { companyId } = params!;

    const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

    if (companyError) {
        console.error('Error fetching company:', companyError.message);
        return { notFound: true };
    }

    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError.message);
        return { notFound: true };
    }

    const { data: ntsUsers, error: ntsUsersError } = await supabase
        .from('nts_users')
        .select('*')
        .eq('company_id', companyId);

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
        revalidate: 10, // Revalidate every 10 seconds
    };
};

export default CompanyPage;