import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import NtsDocuments from '@/components/nts/NtsDocuments';
import withNtsUser from '@/components/hoc/withNtsUser';

const DocumentsPage: React.FC = () => {
    const session = useSession();

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <NtsUsersProvider>
            <SalesLayout>
                <NtsDocuments session={session} />
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default DocumentsPage;