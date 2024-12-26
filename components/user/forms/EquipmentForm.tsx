import React, { useState, useEffect } from 'react';

interface EquipmentFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({
    setFormData,
    setErrorText,
}) => {
    const [year, setYear] = useState('');
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [operationalCondition, setOperationalCondition] = useState<boolean | null>(null);
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState('lbs'); // Default to lbs
    const [loadingUnloadingRequirements, setLoadingUnloadingRequirements] = useState('');
    const [tarping, setTarping] = useState<boolean | null>(null);
    const [isAuction, setIsAuction] = useState<boolean | null>(null);
    const [auction, setAuction] = useState('');
    const [buyerNumber, setBuyerNumber] = useState('');
    const [lotNumber, setLotNumber] = useState('');

    useEffect(() => {
        const formData = {
            year: year.toString(),
            make,
            model,
            operational_condition: operationalCondition,
            length: length.toString(),
            width: width.toString(),
            height: height.toString(),
            weight: weight.toString(),
            weight_unit: weightUnit, // Add weight_unit to formData
            loading_unloading_requirements: loadingUnloadingRequirements,
            tarping,
            auction,
            buyer_number: buyerNumber,
            lot_number: lotNumber,
        };

        setFormData(formData);
    }, [year, make, model, operationalCondition, length, width, height, weight, weightUnit, loadingUnloadingRequirements, tarping, isAuction, auction, buyerNumber, lotNumber, setFormData]);

    return (
        <div className="flex flex-col gap-3">
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Year
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
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Make
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='Caterpillar'
                        value={make}
                        onChange={(e) => {
                            setErrorText('');
                            setMake(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Model
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='D8T'
                        value={model}
                        onChange={(e) => {
                            setErrorText('');
                            setModel(e.target.value);
                        }}
                    />
                </label>
            </div>

            <div className='flex gap-2'>
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
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Weight
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
            <div className='flex gap-2 justify-evenly'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Equipment Condition
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

                <label className='text-zinc-900 font-medium'>Coming from an auction/dealer?
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
            <div className='w-full'>
                {/* <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Tarping
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="tarpingYes"
                            name="tarping"
                            value="yes"
                            checked={tarping === true}
                            onChange={() => {
                                setErrorText('');
                                setTarping(true);
                            }}
                        />
                        <label htmlFor="tarpingYes" className="ml-2">Yes</label>
                        <input
                            type="radio"
                            id="tarpingNo"
                            name="tarping"
                            value="no"
                            checked={tarping === false}
                            onChange={() => {
                                setErrorText('');
                                setTarping(false);
                            }}
                            className="ml-4"
                        />
                        <label htmlFor="tarpingNo" className="ml-2">No</label>
                    </div>
                </label> */}
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Loading/Unloading Requirements
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
                <>
                    <div className='flex gap-2 flex-nowrap w-fit'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Auction/Dealer Name
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
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Buyer Number
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
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Lot Number
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
                </>
            )}
        </div>
    );
};

export default EquipmentForm;