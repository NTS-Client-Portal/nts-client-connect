import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextProps {
    activeChatId: string | null;
    setActiveChatId: (id: string | null) => void;
    isChatOpen: boolean;
    setIsChatOpen: (isOpen: boolean) => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <ChatContext.Provider value={{ activeChatId, setActiveChatId, isChatOpen, setIsChatOpen }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};