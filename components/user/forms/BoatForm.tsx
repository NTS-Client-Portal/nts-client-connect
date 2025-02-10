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
    const [cradle, setCradle] = useState<string | null>(null);
    const [height, setHeight] = useState<string | null>(null);
    const [heightUnit, setHeightUnit] = useState<string | null>(null);
    const [length, setLength] = useState<string | null>(null);
    const [lengthUnit, setLengthUnit] = useState<string | null>(null);
    const [year, setYear] = useState<string | null>(null);
    const [make, setMake] = useState<string | null>(null);
    const [model, setModel] = useState<string | null>(null);
    const [trailer, setTrailer] = useState<string | null>(null);
    const [boatType, setBoatType] = useState<string | null>(null); // Rename type to boatType
    const [weight, setWeight] = useState<string | null>(null);
    const [value, setValue] = useState<string | null>(null);

    useEffect(() => {
        const formData = {
            beam,
            cradle: cradle === 'yes',
            height,
            length,
            trailer: trailer === 'yes',
            type: boatType, // Use boatType here
            weight,
            year,
            make,
            model,
            length_unit: lengthUnit,
            height_unit: heightUnit,
            goods_value: value,
        };

        setFormData(formData);
    }, [beam, year, make, model, lengthUnit, heightUnit, cradle, height, length, value, trailer, boatType, weight, setFormData]);

    return (
        <div className="flex flex-col gap-3">
            <div className='flex flex-col md:flex-row gap-2'>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Year
                <input
                    className="rounded dark:text-zinc-800 w-full p-1 py-1.5 border border-zinc-900/30 shadow-md placeholder:text-sm"
                    type="text"
                    placeholder='e.g. 2020'
                    value={year || ''}
                    onChange={(e) => {
                        setErrorText('');
                        setYear(e.target.value);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Manufacturer
                <input
                    className="rounded dark:text-zinc-800 w-full p-1 py-1.5 border border-zinc-900/30 shadow-md placeholder:text-sm"
                    placeholder='Bayliner, Sea Ray, etc.'
                    value={make || ''}
                    onChange={(e) => {
                        setErrorText('');
                        setMake(e.target.value);
                    }}
                />
            </label>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Model
                <input
                    className="rounded dark:text-zinc-800 w-full p-1 py-1.5 border border-zinc-900/30 shadow-md placeholder:text-sm"
                    placeholder='185 Bowrider, 240 Sundancer, etc.'
                    value={model || ''}
                    onChange={(e) => {
                        setErrorText('');
                        setModel(e.target.value);
                    }}
                />
            </label>    
             </div>
            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Boat Type
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 py-1.5 border border-zinc-900/30 shadow-md placeholder:text-sm"
                        type="text"
                        placeholder='Sailboat, Houseboat, Yacht, etc.'
                        value={boatType || ''} // Use boatType here
                        onChange={(e) => {
                            setErrorText('');
                            setBoatType(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>On Trailer?
                    <select
                        className="rounded w-full p-1 py-1.5 bg-white border border-zinc-900/30 shadow-md"
                        value={trailer || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setTrailer(e.target.value);
                        }}
                    >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Cradle Needed?
                    <select
                        className="rounded bg-white w-full p-1 py-1.5 border border-zinc-900/30 shadow-md"
                        value={cradle || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setCradle(e.target.value);
                        }}
                    >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Value
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 py-1.5 border border-zinc-900/30 shadow-md placeholder:text-sm"
                        type="text"
                        placeholder='e.g. $80,000'
                        value={value || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setValue(e.target.value);
                        }}
                    />
                </label>
            </div>
            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Length
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 py-1.5 border border-zinc-900/30 shadow-md placeholder:text-sm"
                        type="text"
                        placeholder="20&apos; 6&quot;"
                        value={length || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setLength(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Beam
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 py-1.5 border border-zinc-900/30 shadow-md placeholder:text-sm"
                        type="text"
                        placeholder="8&apos; 6&quot;"
                        value={beam || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setBeam(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Height
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 py-1.5 border border-zinc-900/30 shadow-md placeholder:text-sm"
                        type="text"
                        placeholder="9&apos; 6&quot;"
                        value={height || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setHeight(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Weight
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 py-1.5 border border-zinc-900/30 shadow-md placeholder:text-sm"
                        type="text"
                        placeholder='e.g. 20,000'
                        value={weight || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setWeight(e.target.value);
                        }}
                    />
                </label>
            </div>


        </div>
    );
};

export default BoatForm;