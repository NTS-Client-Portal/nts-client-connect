import React, { useState, useEffect } from 'react';

interface ContainerFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
}

const ContainerForm: React.FC<ContainerFormProps> = ({
    setFormData,
    setErrorText,
}) => {
    const [containerLength, setContainerLength] = useState<number | null>(null);
    const [containerType, setContainerType] = useState<string | null>(null);
    const [contentsDescription, setContentsDescription] = useState<string | null>(null);
    const [destinationSurfaceType, setDestinationSurfaceType] = useState<string | null>(null);
    const [destinationType, setDestinationType] = useState<string | null>(null);
    const [destinationTypeDescription, setDestinationTypeDescription] = useState<string | null>(null);
    const [goodsValue, setGoodsValue] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState<boolean | null>(true);
    const [loadingAssistance, setLoadingAssistance] = useState('');
    const [loadingBy, setLoadingBy] = useState<boolean | null>(null);
    const [originSurfaceType, setOriginSurfaceType] = useState<string | null>(null);
    const [originType, setOriginType] = useState<string | null>(null);
    const [originTypeDescription, setOriginTypeDescription] = useState<string | null>(null);

    useEffect(() => {
        const formData = {
            container_length: containerLength,
            container_type: containerType,
            contents_description: contentsDescription,
            destination_surface_type: destinationSurfaceType,
            destination_type: destinationType === 'Business' || destinationType === 'Residential',
            destination_type_description: destinationType === 'Other' ? destinationTypeDescription : null,
            goods_value: goodsValue,
            is_loaded: isLoaded,
            loading_assistance: loadingAssistance,
            origin_surface_type: originSurfaceType,
            origin_type: originType === 'Business' || originType === 'Residential',
            origin_type_description: originType === 'Other' ? originTypeDescription : null,
        };

        setFormData(formData);
    }, [containerLength, containerType, contentsDescription, destinationSurfaceType, destinationType, loadingAssistance, destinationTypeDescription, goodsValue, isLoaded, loadingBy, originSurfaceType, originType, originTypeDescription, setFormData]);

    return (
        <div className="flex flex-col gap-3">
            <div className='flex flex-col md:flex-row gap-2'>
                <div className='flex flex-col w-full'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Container Length
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="number"
                            placeholder="20&apos;"
                            value={containerLength || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setContainerLength(e.target.value ? parseInt(e.target.value) : null);
                            }}
                        />
                    </label>
                </div>
                <div className='flex flex-col w-full'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Container Type
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            placeholder="Standard, 40&apos; High Cube, Flat Rack etc."
                            value={containerType || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setContainerType(e.target.value);
                            }}
                        />
                    </label>
                </div>

            </div>
            <div className='flex flex-col md:flex-row gap-2'>

                <div className='flex flex-col items-center w-full'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Is the container empty or loaded?
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
                            <label htmlFor="isLoadedYes" className="ml-2">Empty</label>
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
                            <label htmlFor="isLoadedNo" className="ml-2">Loaded</label>
                        </div>
                    </label>
                </div>
                <div className='flex flex-col items-center w-full'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Container and/or Contents Value
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                                type="text"
                                placeholder='e.g. $10,000'
                                value={goodsValue || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setGoodsValue(e.target.value);
                                }}
                            />
                        </label>
                    </div>
                
            </div>
            {!isLoaded && (
                <div className='flex flex-col md:flex-row gap-2'>
                    <div className='flex flex-col w-full'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Contents Description
                            <textarea
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                                placeholder='e.g. furniture, electronics, etc.'
                                value={contentsDescription || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setContentsDescription(e.target.value);
                                }}
                            />
                        </label>
                    </div>

                </div>
            )}
            <div className='flex flex-col md:flex-row gap-2'>
                <div className='flex flex-col w-full '>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Origin Type
                        <select
                            className="rounded dark:text-zinc-800 w-full p-1 mb-2 border border-zinc-900/30 shadow-md"
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
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
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
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder="soft ground, concrete, muddy, etc."
                            value={originSurfaceType || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setOriginSurfaceType(e.target.value);
                            }}
                        />
                    </label>
                </div>
                
                <div className='flex flex-col w-full'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Destination Type
                        <select
                            className="rounded dark:text-zinc-800 w-full mb-1 p-1 border border-zinc-900/30 shadow-md"
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
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                                type="text"
                                value={destinationTypeDescription || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setDestinationTypeDescription(e.target.value);
                                }}
                            />
                        </label>
                    )}
                    <label className='text-zinc-900 dark:text-zinc-100 mt-1 font-medium'>Ground Condition at Destination
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder="soft ground, concrete, muddy, etc."
                            value={destinationSurfaceType || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setDestinationSurfaceType(e.target.value);
                            }}
                        />
                    </label>
                </div>
                <div className='flex flex-col items-center w-full'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Loading/Unloading Assistance
                        <select
                            className="rounded bg-white p-1 border border-zinc-900/30 shadow-md text-zinc-600"
                            value={loadingAssistance}
                            onChange={(e) => {
                                setErrorText('');
                                setLoadingAssistance(e.target.value);
                            }}
                        >
                            <option value="">Select...</option>
                            <option value="At Origin">At Origin</option>
                            <option value="At Destination">At Destination</option>
                            <option value="Both Origin and Destination">Both Origin and Destination</option>
                            <option value="None">None</option>
                        </select>
                    </label>
                </div>
            </div>
           
        </div>
    );
};

export default ContainerForm;