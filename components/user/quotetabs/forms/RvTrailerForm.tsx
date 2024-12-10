import React, { useState } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface RvTrailerFormProps {
    session: Session;
    addQuote: (quote: any) => void;
    setErrorText: (value: string) => void;
    closeModal: () => void;
}

const RvTrailerForm: React.FC<RvTrailerFormProps> = ({
    session,
    addQuote,
    setErrorText,
    closeModal,
}) => {
    const supabase = useSupabaseClient<Database>();
    const [classType, setClassType] = useState<string | null>(null);
    const [make, setMake] = useState<string | null>(null);
    const [model, setModel] = useState<string | null>(null);
    const [motorizedOrTrailer, setMotorizedOrTrailer] = useState<string | null>(null);
    const [roadworthy, setRoadworthy] = useState<boolean | null>(null);
    const [vin, setVin] = useState<string | null>(null);
    const [year, setYear] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const quote = {
            user_id: session.user.id,
            type: 'rv_trailers', // Add the type field
            class_type: classType,
            make,
            model,
            motorized_or_trailer: motorizedOrTrailer,
            roadworthy,
            vin,
            year: year?.toString(), // Convert year to string
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

        const { data: rvTrailerData, error: rvTrailerError } = await supabase
            .from('rv_trailers')
            .insert([{
                shipping_quote_id: shippingQuoteData[0].id,
                class_type: classType,
                make,
                model,
                motorized_or_trailer: motorizedOrTrailer,
                roadworthy,
                vin,
                year,
            }])
            .select();

        if (rvTrailerError) {
            console.error('Error adding RV trailer:', rvTrailerError.message);
            setErrorText('Error adding RV trailer');
            return;
        }

        console.log('RV trailer added successfully:', rvTrailerData);

        addQuote(shippingQuoteData[0]);
        setErrorText('');
        closeModal(); // Close the modal after adding the quote
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Class Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={classType || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setClassType(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Make
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={make || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setMake(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Model
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={model || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setModel(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Motorized or Trailer
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={motorizedOrTrailer || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setMotorizedOrTrailer(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Roadworthy
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="checkbox"
                        checked={roadworthy || false}
                        onChange={(e) => {
                            setErrorText('');
                            setRoadworthy(e.target.checked);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>VIN
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={vin || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setVin(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Year
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="number"
                        value={year || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setYear(e.target.value ? parseInt(e.target.value) : null);
                        }}
                    />
                </label>
            </div>
        </form>
    );
};

export default RvTrailerForm;