import React from 'react';

interface BoatFormProps {
    beam: string;
    setBeam: (value: string) => void;
    cradle: boolean;
    setCradle: (value: boolean) => void;
    height: string;
    setHeight: (value: string) => void;
    length: string;
    setLength: (value: string) => void;
    trailer: boolean;
    setTrailer: (value: boolean) => void;
    type: string;
    setType: (value: string) => void;
    weight: string;
    setWeight: (value: string) => void;
    setErrorText: (value: string) => void;
}

const BoatForm: React.FC<BoatFormProps> = ({
    beam, setBeam, cradle, setCradle, height, setHeight, length, setLength, trailer, setTrailer, type, setType, weight, setWeight, setErrorText
}) => {
    return (
        <div className='flex flex-col gap-4'>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Beam
                <input
                    className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                    type="text"
                    value={beam}
                    onChange={(e) => {
                        setErrorText('');
                        setBeam(e.target.value);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Cradle
                <input
                    type="checkbox"
                    checked={cradle}
                    onChange={(e) => {
                        setErrorText('');
                        setCradle(e.target.checked);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Height
                <input
                    className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                    type="text"
                    value={height}
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
                    value={length}
                    onChange={(e) => {
                        setErrorText('');
                        setLength(e.target.value);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Trailer
                <input
                    type="checkbox"
                    checked={trailer}
                    onChange={(e) => {
                        setErrorText('');
                        setTrailer(e.target.checked);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Type
                <input
                    className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                    type="text"
                    value={type}
                    onChange={(e) => {
                        setErrorText('');
                        setType(e.target.value);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Weight
                <input
                    className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                    type="text"
                    value={weight}
                    onChange={(e) => {
                        setErrorText('');
                        setWeight(e.target.value);
                    }}
                />
            </label>
        </div>
    );
};

export default BoatForm;