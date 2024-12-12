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
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Class Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={classType || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setClassType(e.target.value);
                        }}
                    />
                </label>
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
            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Motorized or Trailer
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="text"
                        value={motorizedOrTrailer || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setMotorizedOrTrailer(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Roadworthy
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900"
                        type="checkbox"
                        checked={roadworthy || false}
                        onChange={(e) => {
                            setErrorText('');
                            setRoadworthy(e.target.checked);
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

export default RvTrailerForm;