import React, { useState } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface BoatFormProps {
    session: Session;
    addQuote: (quote: any) => void;
    setErrorText: (value: string) => void;
    closeModal: () => void;
}

const BoatForm: React.FC<BoatFormProps> = ({
    session,
    addQuote,
    setErrorText,
    closeModal,
}) => {
    const supabase = useSupabaseClient<Database>();
    const [beam, setBeam] = useState<string | null>(null);
    const [cradle, setCradle] = useState<boolean | null>(null);
    const [height, setHeight] = useState<string | null>(null);
    const [length, setLength] = useState<string | null>(null);
    const [trailer, setTrailer] = useState<boolean | null>(null);
    const [boatType, setBoatType] = useState<string | null>(null); // Rename type to boatType
    const [weight, setWeight] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const quote = {
            user_id: session.user.id,
            type: 'boats', // Add the type field
            inserted_at: new Date().toISOString(),
        };

        const { data: shippingQuoteData, error: shippingQuoteError } = await supabase
            .from('shippingquotes')
            .insert([quote])
            .select();

        if (shippingQuoteError) {
            console.error('Error adding quote:', shippingQuoteError.message);
            setErrorText('Error adding quote');
            return;
        }

        console.log('Quote added successfully:', shippingQuoteData);

        const { data: boatData, error: boatError } = await supabase
            .from('boats')
            .insert([{
                shipping_quote_id: shippingQuoteData[0].id,
                beam,
                cradle,
                height,
                length,
                trailer,
                type: boatType, // Use boatType here
                weight,
            }])
            .select();

        if (boatError) {
            console.error('Error adding boat:', boatError.message);
            setErrorText('Error adding boat');
            return;
        }

        console.log('Boat added successfully:', boatData);

        addQuote(shippingQuoteData[0]);
        setErrorText('');
        closeModal(); // Close the modal after adding the quote
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Beam
                <input
                    className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                    type="text"
                    value={beam || ''}
                    onChange={(e) => {
                        setErrorText('');
                        setBeam(e.target.value);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Cradle
                <input
                    type="checkbox"
                    checked={cradle || false}
                    onChange={(e) => {
                        setErrorText('');
                        setCradle(e.target.checked);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Height
                <input
                    className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                    type="text"
                    value={height || ''}
                    onChange={(e) => {
                        setErrorText('');
                        setHeight(e.target.value);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Length
                <input
                    className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                    type="text"
                    value={length || ''}
                    onChange={(e) => {
                        setErrorText('');
                        setLength(e.target.value);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Trailer
                <input
                    type="checkbox"
                    checked={trailer || false}
                    onChange={(e) => {
                        setErrorText('');
                        setTrailer(e.target.checked);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Type
                <input
                    className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                    type="text"
                    value={boatType || ''} // Use boatType here
                    onChange={(e) => {
                        setErrorText('');
                        setBoatType(e.target.value);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Weight
                <input
                    className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                    type="text"
                    value={weight || ''}
                    onChange={(e) => {
                        setErrorText('');
                        setWeight(e.target.value);
                    }}
                />
            </label>
        </form>
    );
};

export default BoatForm;