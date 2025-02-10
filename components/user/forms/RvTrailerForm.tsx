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
    const [value, setValue] = useState<string | null>(null);
    const [height, setHeight] = useState<string | null>(null);
    const [length, setLength] = useState<string | null>(null);
    const [width, setWidth] = useState<string | null>(null);
    const [weight, setWeight] = useState<string | null>(null);
    const [lengthUnit, setLengthUnit] = useState('ft');
    const [weightUnit, setWeightUnit] = useState('lbs');
    const [widthUnit, setWidthUnit] = useState('ft');
    const [heightUnit, setHeightUnit] = useState('ft');

    useEffect(() => {
        const formData = {
            class_type: classType,
            make,
            model,
            motorized_or_trailer: motorizedOrTrailer,
            roadworthy,
            vin,
            year: year?.toString() || '',
            goods_value: value,
            height,
            length,
            width,
            weight,
            length_unit: lengthUnit,
            weight_unit: weightUnit,
            width_unit: widthUnit,
            height_unit: heightUnit,
        };

        setFormData(formData);
    }, [classType, make, model, heightUnit, widthUnit, weightUnit, lengthUnit, motorizedOrTrailer, roadworthy, height, length, width, weight, vin, value, year, setFormData]);

    return (
        <div className="flex flex-col gap-3">
            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Year
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
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Make
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
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Model
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
            </div>
            <div className='flex flex-col md:flex-row gap-2'>
                <div className='flex flex-col md:flex-row gap-2'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Length
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder='e.g. 30ft'
                            value={length || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setLength(e.target.value);
                            }}
                        />
                    <select className="rounded bg-white w-full py-1.5 px-1 border border-zinc-900/30 shadow-md"
                        value={lengthUnit}
                        onChange={(e) => {
                            setErrorText('');
                            setLengthUnit(e.target.value);
                        }}
                        >
                        <option value='ft'>Feet</option>
                        <option value='in'>Inches</option>
                        <option value='m'>Meters</option>
                        <option value='mm'>Millimeters</option>
                    </select>
                        </label>
                </div>
               <div className='flex flex-col md:flex-row gap-2'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Width
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder='e.g. 8ft'
                            value={width || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setWidth(e.target.value);
                            }}
                        />
                    <select className="rounded bg-white w-full py-1.5 px-1 border border-zinc-900/30 shadow-md"
                        value={widthUnit}
                        onChange={(e) => {
                            setErrorText('');
                            setWidthUnit(e.target.value);
                        }}
                        >
                        <option value='ft'>Feet</option>
                        <option value='in'>Inches</option>
                        <option value='m'>Meters</option>
                        <option value='mm'>Millimeters</option>
                    </select>
                        </label>
               </div>
               <div className='flex flex-col md:flex-row gap-2'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Height
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder='e.g. 9ft'
                            value={height || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setHeight(e.target.value);
                            }}
                        />
                    <select className="rounded bg-white w-full py-1.5 px-1 border border-zinc-900/30 shadow-md"
                        value={heightUnit}
                        onChange={(e) => {
                            setErrorText('');
                            setHeightUnit(e.target.value);
                        }}
                        >
                        <option value='ft'>Feet</option>
                        <option value='in'>Inches</option>
                        <option value='m'>Meters</option>
                        <option value='mm'>Millimeters</option>
                    </select>
                        </label>
               </div>
                <div className='flex flex-col md:flex-row gap-2'>
                    <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Weight
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder='e.g. 20,000'
                            value={weight || ''}
                            onChange={(e) => {
                                setErrorText('');
                                setWeight(e.target.value);
                            }}
                        />
                    <select className="rounded bg-white w-full py-1.5 px-1 border border-zinc-900/30 shadow-md"
                        value={weightUnit}
                        onChange={(e) => {
                            setErrorText('');
                            setWeightUnit(e.target.value);
                        }}
                        >
                        <option value='lbs'>Pounds</option>
                        <option value='kg'>Kilograms</option>
                        <option value='tons'>Tons</option>
                    </select>
                    </label>
                </div>
            </div>


            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Class Type (if applicable)
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
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Hitch Type (if applicable)
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
            </div>

            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Vehicle Condition
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
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>VIN
                    <input
                        className="rounded dark:text-zinc-800 w-full px-1 py-1.5 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='(optional)'
                        value={vin || ''}
                        onChange={(e) => {
                            setErrorText('');
                            setVin(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Trailer Value
                    <input
                        className="rounded dark:text-zinc-800 w-full px-1 py-1.5 border border-zinc-900/30 shadow-md"
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
        </div>
    );
};

export default RvTrailerForm;