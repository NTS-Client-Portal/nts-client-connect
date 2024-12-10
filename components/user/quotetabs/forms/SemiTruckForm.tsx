import React, { useState } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface SemiTruckFormProps {
    session: Session;
    addQuote: (quote: any) => void;
    setErrorText: (value: string) => void;
    closeModal: () => void;
}

const SemiTruckForm: React.FC<SemiTruckFormProps> = ({
    session,
    addQuote,
    setErrorText,
    closeModal,
}) => {
    const supabase = useSupabaseClient<Database>();
    const [driveawayOrTowaway, setDriveawayOrTowaway] = useState<boolean | null>(null);
    const [height, setHeight] = useState<string | null>(null);
    const [length, setLength] = useState<string | null>(null);
    const [make, setMake] = useState<string | null>(null);
    const [model, setModel] = useState<string | null>(null);
    const [vin, setVin] = useState<string | null>(null);
    const [weight, setWeight] = useState<string | null>(null);
    const [width, setWidth] = useState<string | null>(null);
    const [year, setYear] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const quote = {
            user_id: session.user.id,
            driveaway_or_towaway: driveawayOrTowaway,
            height,
            length,
            make,
            model,
            vin,
            weight,
            width,
            year: year?.toString() || '',
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

        const { data: semiTruckData, error: semiTruckError } = await supabase
            .from('semi_trucks')
            .insert([{
                shipping_quote_id: shippingQuoteData[0].id,
                driveaway_or_towaway: driveawayOrTowaway,
                height,
                length,
                make,
                model,
                vin,
                weight,
                width,
                year,
            }])
            .select();

        if (semiTruckError) {
            console.error('Error adding semi truck:', semiTruckError.message);
            setErrorText('Error adding semi truck');
            return;
        }

        console.log('Semi truck added successfully:', semiTruckData);

        addQuote(shippingQuoteData[0]);
        setErrorText('');
        closeModal(); // Close the modal after adding the quote
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Driveaway or Towaway
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="checkbox"
                        checked={driveawayOrTowaway || false}
                        onChange={(e) => {
                            setErrorText('');
                            setDriveawayOrTowaway(e.target.checked);
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
            </div>
            <div className='flex gap-2'>
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
            </div>
            <div className='flex gap-2'>
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
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Width
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={width || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setWidth(e.target.value);
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

export default SemiTruckForm;