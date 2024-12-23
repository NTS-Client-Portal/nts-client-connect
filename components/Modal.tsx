import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-lg w-full max-w-md relative">
                <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-500" onClick={onClose}>
                    Close
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;