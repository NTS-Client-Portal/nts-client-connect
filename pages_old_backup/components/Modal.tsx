import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string; // Optional title prop for the header
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-md shadow-md h-4/5 w-full max-h-fit  max-w-3xl">
                <div className="bg-ntsBlue w-full sticky top-0 left-0 flex justify-between items-center overflow-y-auto">
                    {title && <h2 className="text-white  px-2 text-xl font-bold text-center">{title}</h2>}
                    <button
                        onClick={onClose}
                        className="bg-red-500 text-white px-4 py-2 hover:bg-red-600 transition duration-200"
                    >
                        Close
                    </button>
                </div>
                <div className="mt-4 bg-white px-12 py-6 w-fit h-4/5 overflow-y-auto ">{children}</div>

            </div>
        </div>
    );
};

export default Modal;