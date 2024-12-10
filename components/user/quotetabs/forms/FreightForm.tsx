import React, { useState } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface FreightFormProps {
    session: Session;
    addQuote: (quote: any) => void;
    setErrorText: (value: string) => void;
    closeModal: () => void;
}

const FreightForm: React.FC<FreightFormProps> = ({
    session,
    addQuote,
    setErrorText,
    closeModal,
}) => {
    const supabase = useSupabaseClient<Database>();
    const [loadDescription, setLoadDescription] = useState('');
    const [length, setLength] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [freightClass, setFreightClass] = useState('');
    const [loadingAssistance, setLoadingAssistance] = useState('');
    const [packagingType, setPackagingType] = useState('');
    const [weightPerPalletUnit, setWeightPerPalletUnit] = useState('');
    const [dockNoDock, setDockNoDock] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const quote = {
            user_id: session.user.id,
            load_description: loadDescription,
            length,
            height,
            weight,
            freight_class: freightClass,
            loading_assistance: loadingAssistance,
            packaging_type: packagingType,
            weight_per_pallet_unit: weightPerPalletUnit,
            dock_no_dock: dockNoDock,
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

        const { data: ltlFtlData, error: ltlFtlError } = await supabase
            .from('ltl_ftl')
            .insert([{
                shipping_quote_id: shippingQuoteData[0].id,
                load_description: loadDescription,
                length,
                height,
                weight,
                freight_class: freightClass,
                loading_assistance: loadingAssistance,
                packaging_type: packagingType,
                weight_per_pallet_unit: weightPerPalletUnit,
                dock_no_dock: dockNoDock,
            }])
            .select();

        if (ltlFtlError) {
            console.error('Error adding LTL/FTL:', ltlFtlError.message);
            setErrorText('Error adding LTL/FTL');
            return;
        }

        console.log('LTL/FTL added successfully:', ltlFtlData);

        addQuote(shippingQuoteData[0]);
        setErrorText('');
        closeModal(); // Close the modal after adding the quote
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Load Description
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={loadDescription}
                        onChange={(e) => {
                            setErrorText('');
                            setLoadDescription(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Length
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={length}
                        onChange={(e) => {
                            setErrorText('');
                            setLength(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Height
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={height}
                        onChange={(e) => {
                            setErrorText('');
                            setHeight(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Weight
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={weight}
                        onChange={(e) => {
                            setErrorText('');
                            setWeight(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Freight Class
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={freightClass}
                        onChange={(e) => {
                            setErrorText('');
                            setFreightClass(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Loading Assistance
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={loadingAssistance}
                        onChange={(e) => {
                            setErrorText('');
                            setLoadingAssistance(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Packaging Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={packagingType}
                        onChange={(e) => {
                            setErrorText('');
                            setPackagingType(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Weight per Pallet/Unit
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={weightPerPalletUnit}
                        onChange={(e) => {
                            setErrorText('');
                            setWeightPerPalletUnit(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Dock / No Dock
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="checkbox"
                        checked={dockNoDock}
                        onChange={(e) => {
                            setErrorText('');
                            setDockNoDock(e.target.checked);
                        }}
                    />
                </label>
            </div>
        </form>
    );
};

export default FreightForm;