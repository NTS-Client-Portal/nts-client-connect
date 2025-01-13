import React from 'react';
import NtsChatRequestsPage from '@/components/chat/NtsChatRequestsPage';
import SalesLayout from '../_components/layout/SalesLayout';
import { NtsUsersProvider } from '@/context/NtsUsersContext';

const ChatRequests: React.FC = () => {
    return (
        <NtsUsersProvider>
            <SalesLayout>
                <NtsChatRequestsPage />
            </SalesLayout>
        </NtsUsersProvider>
    );
};

export default ChatRequests;