import React, { useState, useEffect } from 'react';

interface RvTrailerFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
}

const RvTrailerForm: React.FC<RvTrailerFormProps> = ({
    setFormData,
    setErrorText,
}) => {
    const [classType, setClassType] = useState<string | null>(null);
    const [make, setMake] = useState<string | null>(null);
    const [model, setModel] = useState<string | null>(null);
    const [motorizedOrTrailer, setMotorizedOrTrailer] = useState<string | null>(null);
    const [roadworthy, setRoadworthy] = useState<boolean | null>(null);
    const [vin, setVin] = useState<string | null>(null);
    const [year, setYear] = useState<number | null>(null);

    useEffect(() => {
        const formData = {
            class_type: classType,
            make,
            model,
            motorized_or_trailer: motorizedOrTrailer,
            roadworthy,
            vin,
            year: year?.toString() || '',
        };

        setFormData(formData);
    }, [classType, make, model, motorizedOrTrailer, roadworthy, vin, year, setFormData]);

    return (
        <div className="flex flex-col gap-3">
            <div className='flex gap-2'>

                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Year
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="number"
                        placeholder='2015'
                        value={year || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setYear(e.target.value ? parseInt(e.target.value) : null);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Make
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        placeholder='Winnebago, Fleetwood, etc.'
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
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='Brave, Bounder, etc.'
                        value={model || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setModel(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Class Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='Class A, B, C, etc.'
                        value={classType || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setClassType(e.target.value);
                        }}
                    />
                </label>

            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Hitch Type (if applicable)
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='e.g. 5th wheel, gooseneck, etc.'
                        value={motorizedOrTrailer || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setMotorizedOrTrailer(e.target.value);
                        }}
                    />
                </label>

                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>VIN
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='(optional)'
                        value={vin || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setVin(e.target.value);
                        }}
                    />
                </label>

                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Vehicle Condition
                    <select
                        className="rounded bg-white w-full py-1.5 px-1 border border-zinc-900/30 shadow-md"
                        value={roadworthy === null ? '' : roadworthy ? 'operable' : 'inoperable'}
                        onChange={(e) => {
                            setErrorText('');
                            setRoadworthy(e.target.value === 'operable');
                        }}
                    >
                        <option value="">Select...</option>
                        <option value="operable">Operable</option>
                        <option value="inoperable">Inoperable</option>
                    </select>
                </label>

            </div>
        </div>
    );
};

export default RvTrailerForm;