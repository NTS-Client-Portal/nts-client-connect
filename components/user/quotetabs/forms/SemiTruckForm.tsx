import React, { useState, useEffect } from 'react';

interface SemiTruckFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
}

const SemiTruckForm: React.FC<SemiTruckFormProps> = ({
    setFormData,
    setErrorText,
}) => {
    const [driveawayOrTowaway, setDriveawayOrTowaway] = useState<boolean | null>(null);
    const [height, setHeight] = useState<string | null>(null);
    const [length, setLength] = useState<string | null>(null);
    const [make, setMake] = useState<string | null>(null);
    const [model, setModel] = useState<string | null>(null);
    const [vin, setVin] = useState<string | null>(null);
    const [weight, setWeight] = useState<string | null>(null);
    const [width, setWidth] = useState<string | null>(null);
    const [year, setYear] = useState<number | null>(null);

    useEffect(() => {
        const formData = {
            driveaway_or_towaway: driveawayOrTowaway,
            height,
            length,
            make,
            model,
            vin,
            weight,
            width,
            year: year?.toString() || '',
        };

        setFormData(formData);
    }, [driveawayOrTowaway, height, length, make, model, vin, weight, width, year, setFormData]);

    return (
        <div className="flex flex-col gap-3">
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Driveaway or Towaway
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="checkbox"
                        checked={driveawayOrTowaway || false}
                        onChange={(e) => {
                            setErrorText('');
                            setDriveawayOrTowaway(e.target.checked);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Height
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={height || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setHeight(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Length
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={length || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setLength(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Make
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={make || ''}
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
                        value={model || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setModel(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>VIN
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={vin || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setVin(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Weight
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={weight || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setWeight(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Width
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={width || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setWidth(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Year
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="number"
                        value={year || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setYear(e.target.value ? parseInt(e.target.value) : null);
                        }}
                    />
                </label>
            </div>
        </div>
    );
};

export default SemiTruckForm;