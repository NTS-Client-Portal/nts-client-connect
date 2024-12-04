import React from 'react';

interface SemiTruckFormProps {
    driveawayOrTowaway: boolean | null;
    setDriveawayOrTowaway: (value: boolean | null) => void;
    height: string | null;
    setHeight: (value: string | null) => void;
    length: string | null;
    setLength: (value: string | null) => void;
    make: string | null;
    setMake: (value: string | null) => void;
    model: string | null;
    setModel: (value: string | null) => void;
    vin: string | null;
    setVin: (value: string | null) => void;
    weight: string | null;
    setWeight: (value: string | null) => void;
    width: string | null;
    setWidth: (value: string | null) => void;
    year: number | null;
    setYear: (value: number | null) => void;
    setErrorText: (value: string) => void;
}

const SemiTruckForm: React.FC<SemiTruckFormProps> = ({
    driveawayOrTowaway, setDriveawayOrTowaway, height, setHeight, length, setLength, make, setMake, model, setModel, vin, setVin, weight, setWeight, width, setWidth, year, setYear, setErrorText
}) => {
    return (
        <>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Driveaway or Towaway
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                        type="number"
                        value={year || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setYear(e.target.value ? parseInt(e.target.value) : null);
                        }}
                    />
                </label>
            </div>
        </>
    );
};

export default SemiTruckForm;