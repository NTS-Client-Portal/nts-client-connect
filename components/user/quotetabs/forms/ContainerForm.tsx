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
    const [destinationType, setDestinationType] = useState<string | null>(null);
    const [destinationTypeDescription, setDestinationTypeDescription] = useState<string | null>(null);
    const [goodsValue, setGoodsValue] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState<boolean | null>(null);
    const [loadingBy, setLoadingBy] = useState<boolean | null>(null);
    const [originSurfaceType, setOriginSurfaceType] = useState<string | null>(null);
    const [originType, setOriginType] = useState<string | null>(null);
    const [originTypeDescription, setOriginTypeDescription] = useState<string | null>(null);

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
                destination_type: destinationType === 'Business' || destinationType === 'Residential',
                destination_type_description: destinationType === 'Other' ? destinationTypeDescription : null,
                goods_value: goodsValue,
                is_loaded: isLoaded,
                loading_by: loadingBy,
                origin_surface_type: originSurfaceType,
                origin_type: originType === 'Business' || originType === 'Residential',
                origin_type_description: originType === 'Other' ? originTypeDescription : null,
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className='flex gap-2'>
                <div className='flex flex-col w-1/2'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Container Length
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            type="number"
                            value={containerLength || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setContainerLength(e.target.value ? parseInt(e.target.value) : null);
                            }}
                        />
                    </label>
                </div>
                <div className='flex flex-col w-1/2'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Container Type
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            type="text"
                            value={containerType || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setContainerType(e.target.value);
                            }}
                        />
                    </label>
                </div>
            </div>
            <div className='flex gap-2 w-full'>
                <div className='flex flex-col w-1/2'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin Type
                        <select
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            value={originType || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setOriginType(e.target.value);
                                if (e.target.value !== 'Other') {
                                    setOriginTypeDescription(null);
                                }
                            }}
                        >
                            <option value="">Select...</option>
                            <option value="Business">Business</option>
                            <option value="Residential">Residential</option>
                            <option value="Other">Other</option>
                        </select>
                    </label>
                    {originType === 'Other' && (
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Please Describe Origin Type
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={originTypeDescription || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setOriginTypeDescription(e.target.value);
                                }}
                            />
                        </label>
                    )}
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Ground Condition at Origin
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            type="text"
                            placeholder='soft ground, concrete, muddy, etc.'
                            value={originSurfaceType || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setOriginSurfaceType(e.target.value);
                            }}
                        />
                    </label>
                </div>
                <div className='flex flex-col w-1/2'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination Type
                        <select
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            value={destinationType || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setDestinationType(e.target.value);
                                if (e.target.value !== 'Other') {
                                    setDestinationTypeDescription(null);
                                }
                            }}
                        >
                            <option value="">Select...</option>
                            <option value="Business">Business</option>
                            <option value="Residential">Residential</option>
                            <option value="Other">Other</option>
                        </select>
                    </label>
                    {destinationType === 'Other' && (
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Describe Destination Type
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                                type="text"
                                value={destinationTypeDescription || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setDestinationTypeDescription(e.target.value);
                                }}
                            />
                        </label>
                    )}
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Ground Condition at Destination
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            type="text"
                            placeholder='soft ground, concrete, muddy, etc.'
                            value={destinationSurfaceType || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setDestinationSurfaceType(e.target.value);
                            }}
                        />
                    </label>
                </div>
            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Will Loading Assistance be Provided?
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="loadingByYes"
                            name="loadingBy"
                            value="yes"
                            checked={loadingBy === true}
                            onChange={() => {
                                setErrorText('');
                                setLoadingBy(true);
                            }}
                        />
                        <label htmlFor="loadingByYes" className="ml-2">Yes</label>
                        <input
                            type="radio"
                            id="loadingByNo"
                            name="loadingBy"
                            value="no"
                            checked={loadingBy === false}
                            onChange={() => {
                                setErrorText('');
                                setLoadingBy(false);
                            }}
                            className="ml-4"
                        />
                        <label htmlFor="loadingByNo" className="ml-2">No</label>
                    </div>
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Is the container empty?
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="isLoadedYes"
                            name="isLoaded"
                            value="yes"
                            checked={isLoaded === true}
                            onChange={() => {
                                setErrorText('');
                                setIsLoaded(true);
                            }}
                        />
                        <label htmlFor="isLoadedYes" className="ml-2">Yes</label>
                        <input
                            type="radio"
                            id="isLoadedNo"
                            name="isLoaded"
                            value="no"
                            checked={isLoaded === false}
                            onChange={() => {
                                setErrorText('');
                                setIsLoaded(false);
                            }}
                            className="ml-4"
                        />
                        <label htmlFor="isLoadedNo" className="ml-2">No</label>
                    </div>
                </label>
            </div>
            {!isLoaded && (
                <div className='flex gap-2'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Contents Description
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            type="text"
                            value={contentsDescription || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setContentsDescription(e.target.value);
                            }}
                        />
                    </label>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Container Contents Value
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                            type="text"
                            value={goodsValue || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setGoodsValue(e.target.value);
                            }}
                        />
                    </label>
                </div>
            )}
        </form>
    );
};

export default ContainerForm;