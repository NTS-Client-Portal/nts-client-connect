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
            loading_unloading_requirements: loadingUnloadingRequirements,
            tarping,
            auction,
            buyer_number: buyerNumber,
            lot_number: lotNumber,
        };

        setFormData(formData);
    }, [year, make, model, operationalCondition, length, width, height, weight, loadingUnloadingRequirements, tarping, isAuction, auction, buyerNumber, lotNumber, setFormData]);

    return (
        <div className="flex flex-col gap-3">
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Year
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={year}
                        onChange={(e) => {
                            setErrorText('');
                            setYear(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Make
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={make}
                        onChange={(e) => {
                            setErrorText('');
                            setMake(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Model
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={model}
                        onChange={(e) => {
                            setErrorText('');
                            setModel(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Operational Condition
                    <select
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Width
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={width}
                        onChange={(e) => {
                            setErrorText('');
                            setWidth(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex gap-2'>
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
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Loading/Unloading Requirements
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={loadingUnloadingRequirements}
                        onChange={(e) => {
                            setErrorText('');
                            setLoadingUnloadingRequirements(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex justify-evenly'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Tarping
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
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Is the equipment coming from an auction/dealer?
                    <select
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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
            {isAuction && (
                <>
                    <div className='flex gap-2 flex-nowrap w-fit'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Auction/Dealer Name
                            <input
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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
                                className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
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