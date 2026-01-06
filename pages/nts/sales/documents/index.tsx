import React from 'react';
import { useSession } from '@/lib/supabase/provider';
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import NtsDocuments from '@/components/nts/NtsDocuments';

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