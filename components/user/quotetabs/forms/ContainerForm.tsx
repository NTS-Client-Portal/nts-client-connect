import React, { useState } from 'react';
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';

interface ContainerFormProps {
    session: Session;
    addQuote: (quote: any) => void;
    setErrorText: (value: string) => void;
    closeModal: () => void;
}

const ContainerForm: React.FC<ContainerFormProps> = ({
    session,
    addQuote,
    setErrorText,
    closeModal,
}) => {
    const supabase = useSupabaseClient<Database>();
    const [containerLength, setContainerLength] = useState<number | null>(null);
    const [containerType, setContainerType] = useState<string | null>(null);
    const [contentsDescription, setContentsDescription] = useState<string | null>(null);
    const [destinationSurfaceType, setDestinationSurfaceType] = useState<string | null>(null);
    const [destinationType, setDestinationType] = useState<boolean | null>(null);
    const [goodsValue, setGoodsValue] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState<boolean | null>(null);
    const [loadingBy, setLoadingBy] = useState<boolean | null>(null);
    const [originSurfaceType, setOriginSurfaceType] = useState<string | null>(null);
    const [originType, setOriginType] = useState<boolean | null>(null);
    const [unloadingBy, setUnloadingBy] = useState<boolean | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const quote = {
            user_id: session.user.id,
            containerLength,
            containerType,
            contentsDescription,
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

        const { data: containerData, error: containerError } = await supabase
            .from('containers')
            .insert([{
                shipping_quote_id: shippingQuoteData[0].id,
                container_length: containerLength,
                container_type: containerType,
                contents_description: contentsDescription,
                destination_surface_type: destinationSurfaceType,
                destination_type: destinationType,
                goods_value: goodsValue,
                is_loaded: isLoaded,
                loading_by: loadingBy,
                origin_surface_type: originSurfaceType,
                origin_type: originType,
                unloading_by: unloadingBy,
            }])
            .select();

        if (containerError) {
            console.error('Error adding container:', containerError.message);
            setErrorText('Error adding container');
            return;
        }

        console.log('Container added successfully:', containerData);

        addQuote(shippingQuoteData[0]);
        setErrorText('');
        closeModal(); // Close the modal after adding the quote
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Container Length
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="number"
                        value={containerLength || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setContainerLength(e.target.value ? parseInt(e.target.value) : null);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Container Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={containerType || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setContainerType(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Contents Description
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={contentsDescription || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setContentsDescription(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination Surface Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={destinationSurfaceType || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setDestinationSurfaceType(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="checkbox"
                        checked={destinationType || false}
                        onChange={(e) => {
                            setErrorText('');
                            setDestinationType(e.target.checked);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Goods Value
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={goodsValue || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setGoodsValue(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Is Loaded
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="checkbox"
                        checked={isLoaded || false}
                        onChange={(e) => {
                            setErrorText('');
                            setIsLoaded(e.target.checked);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Loading By
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="checkbox"
                        checked={loadingBy || false}
                        onChange={(e) => {
                            setErrorText('');
                            setLoadingBy(e.target.checked);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin Surface Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="text"
                        value={originSurfaceType || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setOriginSurfaceType(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="checkbox"
                        checked={originType || false}
                        onChange={(e) => {
                            setErrorText('');
                            setOriginType(e.target.checked);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Unloading By
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="checkbox"
                        checked={unloadingBy || false}
                        onChange={(e) => {
                            setErrorText('');
                            setUnloadingBy(e.target.checked);
                        }}
                    />
                </label>
            </div>
        </form>
    );
};

export default ContainerForm;