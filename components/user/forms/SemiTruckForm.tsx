import React, { useState, useEffect } from 'react';

interface SemiTruckFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
}

const SemiTruckForm: React.FC<SemiTruckFormProps> = ({
    setFormData,
    setErrorText,
}) => {
    const [year, setYear] = useState('');
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState('lbs');
    const [vin, setVin] = useState('');
    const [operationalCondition, setOperationalCondition] = useState<boolean | null>(null);
    const [isAuction, setIsAuction] = useState<boolean | null>(null);
    const [auction, setAuction] = useState('');
    const [buyerNumber, setBuyerNumber] = useState('');
    const [lotNumber, setLotNumber] = useState('');
    const [loadingUnloadingRequirements, setLoadingUnloadingRequirements] = useState('');

    useEffect(() => {
        const formData = {
            year,
            make,
            model,
            length,
            width,
            height,
            weight,
            weight_unit: weightUnit,
            vin,
            operational_condition: operationalCondition,
            is_auction: isAuction,
            auction,
            buyer_number: buyerNumber,
            lot_number: lotNumber,
            loading_unloading_requirements: loadingUnloadingRequirements,
        };

        setFormData(formData);
    }, [year, make, model, length, width, height, weight, weightUnit, vin, operationalCondition, isAuction, auction, buyerNumber, lotNumber, loadingUnloadingRequirements, setFormData]);

    return (
        <div className="flex flex-col gap-3">
            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Year
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='2020'
                        value={year}
                        onChange={(e) => {
                            setErrorText('');
                            setYear(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Make
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='Freightliner'
                        value={make}
                        onChange={(e) => {
                            setErrorText('');
                            setMake(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Model
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='Cascadia 126'
                        value={model}
                        onChange={(e) => {
                            setErrorText('');
                            setModel(e.target.value);
                        }}
                    />
                </label>
            </div>

            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Length
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder="25&apos; 6&quot;"
                        value={length}
                        onChange={(e) => {
                            setErrorText('');
                            setLength(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Width
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder="8&apos; 6&quot;"
                        value={width}
                        onChange={(e) => {
                            setErrorText('');
                            setWidth(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Height
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder="13&apos; 4&quot;"
                        value={height}
                        onChange={(e) => {
                            setErrorText('');
                            setHeight(e.target.value);
                        }}
                    />
                </label>
            </div>

            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Weight
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
            </div>

            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Vehicle Condition
                    <select
                        className="rounded bg-white w-full py-1.5 px-1 border border-zinc-900/30 shadow-md"
                        value={operationalCondition === null ? '' : operationalCondition ? 'operable' : 'inoperable'}
                        onChange={(e) => {
                            setErrorText('');
                            setOperationalCondition(e.target.value === 'operable');
                        }}
                    >
                        <option value="">Select...</option>
                        <option value="operable">Operable</option>
                        <option value="inoperable">Inoperable</option>
                    </select>
                </label>

                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Coming from an auction/dealer?
                    <select
                        className="rounded w-full bg-white px-1 py-1.5 border border-zinc-900/30 shadow-md"
                        value={isAuction === null ? '' : isAuction ? 'yes' : 'no'}
                        onChange={(e) => {
                            setErrorText('');
                            setIsAuction(e.target.value === 'yes');
                        }}
                    >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </label>
            </div>

            <div className='flex flex-col gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Loading/Unloading Requirements
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='e.g. Tarp, Forklift, Ramp, Dock'
                        value={loadingUnloadingRequirements}
                        onChange={(e) => {
                            setErrorText('');
                            setLoadingUnloadingRequirements(e.target.value);
                        }}
                    />
                </label>
            </div>

            {isAuction && (
                <div className='flex flex-col md:flex-row gap-2'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Auction/Dealer Name
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            value={auction}
                            onChange={(e) => {
                                setErrorText('');
                                setAuction(e.target.value);
                            }}
                        />
                    </label>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Buyer Number
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            value={buyerNumber}
                            onChange={(e) => {
                                setErrorText('');
                                setBuyerNumber(e.target.value);
                            }}
                        />
                    </label>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Lot Number
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            value={lotNumber}
                            onChange={(e) => {
                                setErrorText('');
                                setLotNumber(e.target.value);
                            }}
                        />
                    </label>
                </div>
            )}
        </div>
    );
};

export default SemiTruckForm;