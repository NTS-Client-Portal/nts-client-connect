import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import DashboardTabs from '@/components/nts/DashboardTabs';
import SalesLayout from '../nts/sales/_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';

interface CompanyPageProps {
    company: any;
}

const CompanyPage: React.FC<CompanyPageProps> = ({ company }) => {
    const router = useRouter();
    const supabase = useSupabaseClient<Database>();

    if (router.isFallback) {
        return <div>Loading...</div>;
    }

    return (
        <NtsUsersProvider>
            <SalesLayout>
                <div>
                    <h1>{company.company_name}</h1>
                    <DashboardTabs companyId={company.id} />
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
    const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', params?.companyId)
        .single();

    if (error) {
        console.error('Error fetching company:', error.message);
        return { notFound: true };
    }

    return {
        props: {
            company,
        },
        revalidate: 60, // Revalidate the page every 60 seconds
    };
};

export default CompanyPage;