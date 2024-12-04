import React from 'react';

interface RvTrailerFormProps {
    classType: string | null;
    setClassType: (value: string | null) => void;
    make: string | null;
    setMake: (value: string | null) => void;
    model: string | null;
    setModel: (value: string | null) => void;
    motorizedOrTrailer: string | null;
    setMotorizedOrTrailer: (value: string | null) => void;
    roadworthy: boolean | null;
    setRoadworthy: (value: boolean | null) => void;
    vin: string | null;
    setVin: (value: string | null) => void;
    year: number | null;
    setYear: (value: number | null) => void;
    setErrorText: (value: string) => void;
}

const RvTrailerForm: React.FC<RvTrailerFormProps> = ({
    classType, setClassType, make, setMake, model, setModel, motorizedOrTrailer, setMotorizedOrTrailer, roadworthy, setRoadworthy, vin, setVin, year, setYear, setErrorText
}) => {
    return (
        <>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Class Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
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
            </div>
            <div className='flex gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Motorized or Trailer
                    <input
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
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
                        className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
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

export default RvTrailerForm;