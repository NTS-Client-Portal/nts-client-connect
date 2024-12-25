import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DocumentNotificationContextProps {
    newDocumentAdded: boolean;
    setNewDocumentAdded: (value: boolean) => void;
}

const DocumentNotificationContext = createContext<DocumentNotificationContextProps | undefined>(undefined);

export const DocumentNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [newDocumentAdded, setNewDocumentAdded] = useState(false);

    return (
        <DocumentNotificationContext.Provider value={{ newDocumentAdded, setNewDocumentAdded }}>
            {children}
        </DocumentNotificationContext.Provider>
    );
};

export const useDocumentNotification = () => {
    const context = useContext(DocumentNotificationContext);
    if (context === undefined) {
        throw new Error('useDocumentNotification must be used within a DocumentNotificationProvider');
    }
    return context;
};