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
    const [weight, setWeight] = useState('');
    const [freightClass, setFreightClass] = useState('');
    const [loadingAssistance, setLoadingAssistance] = useState('');
    const [packagingType, setPackagingType] = useState('');
    const [weightPerPalletUnit, setWeightPerPalletUnit] = useState('');
    const [dockNoDock, setDockNoDock] = useState(false);

    useEffect(() => {
        const formData = {
            load_description: loadDescription,
            length,
            height,
            weight,
            freight_class: freightClass,
            loading_assistance: loadingAssistance,
            packaging_type: packagingType,
            weight_per_pallet_unit: weightPerPalletUnit,
            dock_no_dock: dockNoDock,
        };

        setFormData(formData);
    }, [loadDescription, length, height, weight, freightClass, loadingAssistance, packagingType, weightPerPalletUnit, dockNoDock, setFormData]);

    return (
        <div className="flex flex-col gap-3">
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Load Description
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="checkbox"
                        checked={dockNoDock}
                        onChange={(e) => {
                            setErrorText('');
                            setDockNoDock(e.target.checked);
                        }}
                    />
                </label>
            </div>
        </div>
    );
};

export default FreightForm;