import React, { useState, useEffect } from 'react';

interface AutoFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
    formData: any;
}

const AutoForm: React.FC<AutoFormProps> = ({
    setFormData,
    setErrorText,
    formData,
}) => {
    const [year, setYear] = useState(formData.auto_year || '');
    const [make, setMake] = useState(formData.auto_make || '');
    const [model, setModel] = useState(formData.auto_model || '');
    const [vin, setVin] = useState(formData.vin || '');
    const [operationalCondition, setOperationalCondition] = useState<boolean | null>(formData.operational_condition || null);
    const [auction, setAuction] = useState(formData.auction || '');
    const [isAuction, setIsAuction] = useState<boolean | null>(formData.is_auction || null);
    const [buyerNumber, setBuyerNumber] = useState(formData.buyer_number || '');
    const [lotNumber, setLotNumber] = useState(formData.lot_number || '');
    const [value, setValue] = useState(formData.goods_value || '');

    useEffect(() => {
        const updatedFormData = {
            auto_year: year.toString(),
            auto_make: make,
            auto_model: model,
            vin,
            operational_condition: operationalCondition,
            auction,
            buyer_number: buyerNumber,
            lot_number: lotNumber,
            goods_value: value,
        };
        setFormData(updatedFormData);
    }, [year, make, model, vin, operationalCondition, auction, buyerNumber, lotNumber, value, setFormData]);

    return (
        <div className="flex flex-col gap-3">
            <div className="border p-3 rounded-md shadow-md">
                <div className='flex flex-col md:flex-row gap-2'>
                    <div className="flex flex-col w-full md:w-1/4">
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Year</label>
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder='e.g. 2020'
                            value={year}
                            onChange={(e) => {
                                setErrorText('');
                                setYear(e.target.value);
                            }}
                        />
                    </div>
                    <div className='flex flex-col w-full md:w-1/3'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Make</label>
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            value={make}
                            placeholder='Toyota'  
                            onChange={(e) => {
                                setErrorText('');
                                setMake(e.target.value);
                            }}                              
                        />
                    </div>
                    <div className='flex flex-col w-full md:w-1/3'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Model</label>
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            value={model}
                            placeholder='RAV4'
                            onChange={(e) => {
                                setErrorText('');
                                setModel(e.target.value);
                            }}
                        />
                    </div>
                </div>
                <div className='flex flex-col md:flex-row gap-2 mt-3'>
                    <div className='flex flex-col w-full md:w-1/4'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Vehicle Value</label>
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            value={value}
                            placeholder='e.g. $20,000'
                            onChange={(e) => {
                                setErrorText('');
                                setValue(e.target.value);
                            }}
                        />
                    </div>
                    <div className='flex flex-col w-full md:w-1/2'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>VIN #</label>
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            placeholder='optional'
                            type="text"
                            value={vin}
                            onChange={(e) => {
                                setErrorText('');
                                setVin(e.target.value);
                            }}
                        />
                    </div>
                    <div className='flex flex-col w-full md:w-1/4'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Vehicle Condition</label>
                        <select
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
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
                    </div>
                    <div className='flex flex-col w-full md:w-1/3'>
                        <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Auction/Dealer Pickup?</label>
                        <select
                            className='rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md'
                            value={auction === null ? '' : auction ? 'yes' : 'no'}
                            onChange={(e) => {
                                setErrorText('');
                                setIsAuction(e.target.value === 'yes');
                            }}
                        >
                            <option value="">Select...</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                </div>
                {isAuction && (
                    <div className='flex flex-col md:flex-row gap-2 mt-4'>
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
        </div>
    );
};

export default AutoForm;