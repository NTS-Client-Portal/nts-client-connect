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
    const [lengthUnit, setLengthUnit] = useState('in');
    const [height, setHeight] = useState('');
    const [heightUnit, setHeightUnit] = useState('in');
    const [width, setWidth] = useState('');
    const [widthUnit, setWidthUnit] = useState('lbs');
    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState('lbs');
    const [freightClass, setFreightClass] = useState('');
    const [loadingAssistance, setLoadingAssistance] = useState('');
    const [packagingType, setPackagingType] = useState('');
    const [weightPerPalletUnit, setWeightPerPalletUnit] = useState('');
    const [dockNoDock, setDockNoDock] = useState('');
    const [value , setValue] = useState('');

    useEffect(() => {
        const formData = {
            commodity: loadDescription,
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
            goods_value: value,
        };

        setFormData(formData);
    }, [loadDescription, length, height, width, value, weight, weightUnit, freightClass, loadingAssistance, packagingType, weightPerPalletUnit, dockNoDock, setFormData]);

    return (
        <div className="flex flex-col gap-3">
            <div className='flex flex-col md:flex-row gap-2'>
                <div className='flex flex-col gap-1'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Length
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder="48"
                            value={length}
                            onChange={(e) => {
                                setErrorText('');
                                setLength(e.target.value);
                            }}
                        />
                    </label>
                    <select className='rounded bg-white p-1 border border-zinc-900/30 shadow-md' value={lengthUnit} onChange={(e) => setLengthUnit(e.target.value)}>
                        <option value="in">in</option>
                        <option value="ft">ft</option>
                        <option value="cm">cm</option>
                        <option value="m">m</option>
                    </select>
                </div>
                <div className='flex flex-col gap-1'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Width
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder="48"
                            value={width}
                            onChange={(e) => {
                                setErrorText('');
                                setWidth(e.target.value);
                            }}
                        />
                    </label>
                    <select className='rounded bg-white p-1 border border-zinc-900/30 shadow-md' value={widthUnit} onChange={(e) => setWidthUnit(e.target.value)}>
                        <option value="in">in</option>
                        <option value="ft">ft</option>
                        <option value="cm">cm</option>
                        <option value="m">m</option>
                    </select>
                </div>

                <div className='flex flex-col gap-1'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Height
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder="48"
                            value={height}
                            onChange={(e) => {
                                setErrorText('');
                                setHeight(e.target.value);
                            }}
                        />
                    </label>
                    <select className='rounded bg-white p-1 border border-zinc-900/30 shadow-md' value={heightUnit} onChange={(e) => setHeightUnit(e.target.value)}>
                        <option value="in">in</option>
                        <option value="ft">ft</option>
                        <option value="cm">cm</option>
                        <option value="m">m</option>
                    </select>
                </div>
                <div className='flex flex-col gap-1'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Weight Per Unit
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder='e.g. 1,500'
                            value={weight}
                            onChange={(e) => {
                                setErrorText('');
                                setWeight(e.target.value);
                            }}
                        /></label>
                           
                        <select
                            className="rounded bg-white p-1 border border-zinc-900/30 shadow-md"
                            value={weightUnit}
                            onChange={(e) => setWeightUnit(e.target.value)}
                        >
                            <option value="lbs">lbs</option>
                            <option value="tons">tons</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                        </select>
                </div>

            </div>

            <div className='flex flex-col md:flex-row gap-2'>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Total Freight Value
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='e.g. 20,000'
                        value={value}
                        onChange={(e) => {
                            setErrorText('');
                            setValue(e.target.value);
                        }}
                    /> 
                </label>
                
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Freight Class
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

            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Lift Gate
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
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Docks Available?
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
            </div>

            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Packaging Type
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
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Freight Item/Description
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