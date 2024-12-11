import React, { useState, useEffect } from 'react';

interface BoatFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
}

const BoatForm: React.FC<BoatFormProps> = ({
    setFormData,
    setErrorText,
}) => {
    const [beam, setBeam] = useState<string | null>(null);
    const [cradle, setCradle] = useState<boolean | null>(null);
    const [height, setHeight] = useState<string | null>(null);
    const [length, setLength] = useState<string | null>(null);
    const [trailer, setTrailer] = useState<boolean | null>(null);
    const [boatType, setBoatType] = useState<string | null>(null); // Rename type to boatType
    const [weight, setWeight] = useState<string | null>(null);

    useEffect(() => {
        const formData = {
            beam,
            cradle,
            height,
            length,
            trailer,
            type: boatType, // Use boatType here
            weight,
        };

        setFormData(formData);
    }, [beam, cradle, height, length, trailer, boatType, weight, setFormData]);

    return (
        <div className="flex flex-col gap-4">
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Beam
                <input
                    className="rounded dark:text-zinc-800 w-full p-2 border border-zinc-900"
                    type="text"
                    value={beam || ''}
                    onChange={(e) => {
                        setErrorText('');
                        setBeam(e.target.value);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Cradle
                <input
                    type="checkbox"
                    checked={cradle || false}
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
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Trailer
                <input
                    type="checkbox"
                    checked={trailer || false}
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
                    value={boatType || ''} // Use boatType here
                    onChange={(e) => {
                        setErrorText('');
                        setBoatType(e.target.value);
                    }}
                />
            </label>
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
        </div>
    );
};

export default BoatForm;