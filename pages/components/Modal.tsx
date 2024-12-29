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
            <div className="bg-white pb-4 rounded-md shadow-md f-full w-full  max-w-3xl">
                <div className="bg-ntsBlue w-full sticky top-0 left-0 flex justify-between items-center overflow-y-auto">
                    {title && <h2 className="text-white  px-2 text-xl font-bold text-center">{title}</h2>}
                    <button
                        onClick={onClose}
                        className="text-2xl pl-4 font-bold text-white hover:text-gray-300"
                    >
                        &times;
                    </button>
                </div>
                <div className="mt-4 bg-white px-4 h-96 overflow-y-auto ">{children}</div>
            </div>
        </div>
    );
};

export default Modal;