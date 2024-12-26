import React, { useState, useEffect } from 'react';

interface FreightFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
}

const FreightForm: React.FC<FreightFormProps> = ({
    setFormData,
    setErrorText,
}) => {
    const [loadDescription, setLoadDescription] = useState('');
    const [length, setLength] = useState('');
    const [height, setHeight] = useState('');
    const [width, setWidth] = useState('');
    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState('lbs');
    const [freightClass, setFreightClass] = useState('');
    const [loadingAssistance, setLoadingAssistance] = useState('');
    const [packagingType, setPackagingType] = useState('');
    const [weightPerPalletUnit, setWeightPerPalletUnit] = useState('');
    const [dockNoDock, setDockNoDock] = useState('');

    useEffect(() => {
        const formData = {
            load_description: loadDescription,
            length,
            width,
            height,
            weight,
            weight_unit: weightUnit,
            freight_class: freightClass,
            loading_assistance: loadingAssistance,
            packaging_type: packagingType,
            weight_per_pallet_unit: weightPerPalletUnit,
            dock_no_dock: dockNoDock,
        };

        setFormData(formData);
    }, [loadDescription, length, height, weight, weightUnit, freightClass, loadingAssistance, packagingType, weightPerPalletUnit, dockNoDock, setFormData]);

    return (
        <div className="grid grid-cols-2 my-4">
            <div className='flex flex-col gap-2 w-2/3'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Length
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder="20&apos; 6&quot;"
                        value={length}
                        onChange={(e) => {
                            setErrorText('');
                            setLength(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Width
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder="7&apos; 6&quot;"
                        value={width}
                        onChange={(e) => {
                            setErrorText('');
                            setWidth(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Height
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder="9&apos; 6&quot;"
                        value={height}
                        onChange={(e) => {
                            setErrorText('');
                            setHeight(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Weight Per Pallet
                    <div className="flex items-center">
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder='e.g. 30,000'
                            value={weight}
                            onChange={(e) => {
                                setErrorText('');
                                setWeight(e.target.value);
                            }}
                        />
                        <select
                            className="rounded bg-white p-1 border border-zinc-900/30 shadow-md ml-2"
                            value={weightUnit}
                            onChange={(e) => setWeightUnit(e.target.value)}
                        >
                            <option value="lbs">lbs</option>
                            <option value="tons">tons</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                        </select>
                    </div>
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Freight Class
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='optional'
                        value={freightClass}
                        onChange={(e) => {
                            setErrorText('');
                            setFreightClass(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex flex-col gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Lift Gate
                    <select
                        className="rounded bg-white w-full p-1 border border-zinc-900/30 shadow-md text-zinc-600"
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
                    </select>
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Dock / No Dock
                    <select
                        className="rounded bg-white w-full p-1 border border-zinc-900/30 shadow-md text-zinc-600"
                        value={dockNoDock}
                        onChange={(e) => {
                            setErrorText('');
                            setDockNoDock(e.target.value);
                        }}
                    >
                        <option value="">Select...</option>
                        <option value="At Origin">At Origin</option>
                        <option value="At Destination">At Destination</option>
                        <option value="Both Origin and Destination">Both Origin and Destination</option>
                    </select>
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Packaging Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        placeholder='e.g. pallet, skid, crate, etc.'
                        type="text"
                        value={packagingType}
                        onChange={(e) => {
                            setErrorText('');
                            setPackagingType(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Freight Item/Description
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='e.g. footwear, autoparts, etc.'
                        value={loadDescription}
                        onChange={(e) => {
                            setErrorText('');
                            setLoadDescription(e.target.value);
                        }}
                    />
                </label>

            </div>
        </div>
    );
};

export default FreightForm;