import React, { useState } from 'react';
import { Session } from '@supabase/auth-helpers-react';
import SelectOption from './SelectOption';

interface QuoteFormProps {
    isOpen: boolean;
    onClose: () => void;
    addQuote: (quote: any) => void;
    errorText: string;
    setErrorText: (value: string) => void;
    session: Session;
    fetchQuotes: () => void; // Add fetchQuotes prop
}

const QuoteForm: React.FC<QuoteFormProps> = ({ isOpen, onClose, addQuote, errorText, setErrorText, session, fetchQuotes }) => {
    const [selectedOption, setSelectedOption] = useState('');
    const [saveToInventory, setSaveToInventory] = useState(false);
    const [originZip, setOriginZip] = useState('');
    const [originCity, setOriginCity] = useState('');
    const [originState, setOriginState] = useState('');
    const [destinationZip, setDestinationZip] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [destinationState, setDestinationState] = useState('');
    const [dueDate, setDueDate] = useState<string | null>(null);

    const handleZipCodeBlur = async (type: 'origin' | 'destination') => {
        const zipCode = type === 'origin' ? originZip : destinationZip;
        if (zipCode.length === 5) {
            try {
                const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
                if (response.ok) {
                    const data = await response.json();
                    const city = data.places[0]['place name'];
                    const state = data.places[0]['state abbreviation'];
                    if (type === 'origin') {
                        setOriginCity(city);
                        setOriginState(state);
                    } else {
                        setDestinationCity(city);
                        setDestinationState(state);
                    }
                } else {
                    if (type === 'origin') {
                        setOriginCity('');
                        setOriginState('');
                    } else {
                        setDestinationCity('');
                        setDestinationState('');
                    }
                }
            } catch (error) {
                console.error('Error fetching city and state:', error);
                if (type === 'origin') {
                    setOriginCity('');
                    setOriginState('');
                } else {
                    setDestinationCity('');
                    setDestinationState('');
                }
            }
        }
    };

    const handleZipCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'origin' | 'destination') => {
        if (e.key === 'Enter') {
            handleZipCodeBlur(type);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Add your form submission logic here
        // After successful form submission, call fetchQuotes to refresh the list
        fetchQuotes();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-zinc-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-3xl">
                <h2 className="text-xl mb-4">Request a Shipping Estimate</h2>
                    <SelectOption
                        selectedOption={selectedOption}
                        setSelectedOption={setSelectedOption}
                        setErrorText={setErrorText}
                        session={session}
                        addQuote={addQuote}
                        closeModal={onClose}
                    />
                    {selectedOption && (
                        <div className='flex gap-1 text-zinc-600 text-sm font-semibold'>
                            <input
                                type="checkbox"
                                checked={saveToInventory}
                                onChange={(e) => setSaveToInventory(e.target.checked)}
                            />
                            Check Here to Save Freight to Inventory
                        </div>
                    )}
                    <div className='flex gap-2'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin Zip
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={originZip}
                                onChange={(e) => setOriginZip(e.target.value)}
                                onBlur={() => handleZipCodeBlur('origin')}
                                onKeyDown={(e) => handleZipCodeKeyDown(e, 'origin')}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin City
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={originCity}
                                onChange={(e) => setOriginCity(e.target.value)}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin State
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={originState}
                                onChange={(e) => setOriginState(e.target.value)}
                            />
                        </label>
                    </div>
                    <div className='flex gap-2'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination Zip
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={destinationZip}
                                onChange={(e) => setDestinationZip(e.target.value)}
                                onBlur={() => handleZipCodeBlur('destination')}
                                onKeyDown={(e) => handleZipCodeKeyDown(e, 'destination')}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination City
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={destinationCity}
                                onChange={(e) => setDestinationCity(e.target.value)}
                            />
                        </label>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination State
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={destinationState}
                                onChange={(e) => setDestinationState(e.target.value)}
                            />
                        </label>
                    </div>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Shipping Date
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            type="date"
                            value={dueDate || ''} // Ensure dueDate is either a valid timestamp or an empty string
                            onChange={(e) => {
                                setErrorText('');
                                setDueDate(e.target.value || null); // Set dueDate to null if the input is empty
                            }}
                        />
                    </label>
                    <div className='flex justify-center'>
                        <div className='flex gap-2 w-full justify-around'>
                            <button type="button" className="body-btn w-2/3 place-self-center" onClick={onClose}>
                                Submit
                            </button>
                            <button onClick={onClose} className="cancel-btn mt-4 w-1/4 place-self-center">
                                Close
                            </button>
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default QuoteForm;