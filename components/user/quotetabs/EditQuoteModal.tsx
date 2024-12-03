import React, { useState, useEffect } from 'react';
import { ShippingQuote } from '@/lib/schema';

interface EditQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedQuote: ShippingQuote) => void;
    quote: ShippingQuote | null;
}

const EditQuoteModal: React.FC<EditQuoteModalProps> = ({ isOpen, onClose, onSubmit, quote }) => {
    const [updatedQuote, setUpdatedQuote] = useState<ShippingQuote | null>(quote);

    useEffect(() => {
        setUpdatedQuote(quote);
    }, [quote]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (updatedQuote) {
            setUpdatedQuote({
                ...updatedQuote,
                [e.target.name]: e.target.value,
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (updatedQuote) {
            onSubmit(updatedQuote);
        }
    };

    if (!isOpen || !updatedQuote) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-4 rounded shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Quote</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Origin City</label>
                        <input
                            type="text"
                            name="origin_city"
                            value={updatedQuote.origin_city}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Destination City</label>
                        <input
                            type="text"
                            name="destination_city"
                            value={updatedQuote.destination_city}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    {/* Add more fields as needed */}
                    <div className="flex justify-end">
                        <button type="button" onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 rounded">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditQuoteModal;