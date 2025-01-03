import React from 'react';
import ChatRequestsPage from '@/components/chat/ChatRequestsPage';
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';
import withNtsUser from '@/components/hoc/withNtsUser';

const ChatRequests: React.FC = () => {
    return (
        <NtsUsersProvider>
            <SalesLayout>
                <ChatRequestsPage />
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default withNtsUser(ChatRequests);