import React, { useState, useEffect } from 'react';

interface EquipmentFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
    formData: any;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({
    setFormData,
    setErrorText,
    formData,
}) => {
    const [year, setYear] = useState(formData.year || '');
    const [make, setMake] = useState(formData.make || '');
    const [model, setModel] = useState(formData.model || '');
    const [length, setLength] = useState(formData.length || '');
    const [lengthUnit, setLengthUnit] = useState(formData.length_unit || 'ft'); // Default to feet
    const [width, setWidth] = useState(formData.width || '');
    const [widthUnit, setWidthUnit] = useState(formData.width_unit || 'ft'); // Default to feet
    const [height, setHeight] = useState(formData.height || '');
    const [heightUnit, setHeightUnit] = useState(formData.height_unit || 'ft'); // Default to feet
    const [weight, setWeight] = useState(formData.weight || '');
    const [weightUnit, setWeightUnit] = useState(formData.weight_unit || 'lbs'); // Default to lbs
    const [operationalCondition, setOperationalCondition] = useState<boolean | null>(formData.operational_condition || null);
    const [loadingUnloadingRequirements, setLoadingUnloadingRequirements] = useState(formData.loading_unloading_requirements || '');
    const [tarping, setTarping] = useState<boolean | null>(formData.tarping || null);
    const [isAuction, setIsAuction] = useState<boolean | null>(formData.is_auction || null);
    const [auction, setAuction] = useState(formData.auction || '');
    const [buyerNumber, setBuyerNumber] = useState(formData.buyer_number || '');
    const [lotNumber, setLotNumber] = useState(formData.lot_number || '');

    useEffect(() => {
        const updatedFormData = {
            year: year.toString(),
            make,
            model,
            length: length.toString(),
            length_unit: lengthUnit,
            width: width.toString(),
            width_unit: widthUnit,
            height: height.toString(),
            height_unit: heightUnit,
            weight: weight.toString(),
            weight_unit: weightUnit,
            operational_condition: operationalCondition,
            loading_unloading_requirements: loadingUnloadingRequirements,
            tarping,
            auction,
            buyer_number: buyerNumber,
            lot_number: lotNumber,
        };

        setFormData(updatedFormData);
    }, [year, make, model, length, lengthUnit, width, widthUnit, height, heightUnit, weight, weightUnit, operationalCondition, loadingUnloadingRequirements, tarping, isAuction, auction, buyerNumber, lotNumber, setFormData]);

    return (
        <div className="flex flex-col gap-3">
            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Year
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='2020'
                        value={year}
                        onChange={(e) => {
                            setErrorText('');
                            setYear(e.target.value);
                        }}
                    />
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Make
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='Caterpillar'
                        value={make}
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
                        placeholder='D8T'
                        value={model}
                        onChange={(e) => {
                            setErrorText('');
                            setModel(e.target.value);
                        }}
                    />
                </label>
            </div>

            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Length
                    <div className="flex items-center">
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder=""
                            value={length}
                            onChange={(e) => {
                                setErrorText('');
                                setLength(e.target.value);
                            }}
                        />
                        <select
                            className="rounded text-zinc-900 w-full px-2 py-1 border border-zinc-900 ml-2"
                            value={lengthUnit}
                            onChange={(e) => setLengthUnit(e.target.value)}
                        >
                            <option value="ft">Feet</option>
                            <option value="in">Inches</option>
                        </select>
                    </div>
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Width
                    <div className="flex items-center">
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder=""
                            value={width}
                            onChange={(e) => {
                                setErrorText('');
                                setWidth(e.target.value);
                            }}
                        />
                        <select
                            className="rounded text-zinc-900 w-full px-2 py-1 border border-zinc-900 ml-2"
                            value={widthUnit}
                            onChange={(e) => setWidthUnit(e.target.value)}
                        >
                            <option value="ft">Feet</option>
                            <option value="in">Inches</option>
                        </select>
                    </div>
                </label>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Height
                    <div className="flex items-center">
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder=""
                            value={height}
                            onChange={(e) => {
                                setErrorText('');
                                setHeight(e.target.value);
                            }}
                        />
                        <select
                            className="rounded text-zinc-900 w-full px-2 py-1 border border-zinc-900 ml-2"
                            value={heightUnit}
                            onChange={(e) => setHeightUnit(e.target.value)}
                        >
                            <option value="ft">Feet</option>
                            <option value="in">Inches</option>
                        </select>
                    </div>
                </label>
            </div>

            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Weight
                    <div className="flex items-center">
                        <input
                            className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                            type="text"
                            placeholder='e.g. 30,000'
                            value={weight}
                            onChange={(e) => {
                                setErrorText('');
                                setWeight(e.target.value);
                            }}
                        />
                        <select
                            className="rounded bg-white p-1 border border-zinc-900/30 shadow-md ml-2"
                            value={weightUnit}
                            onChange={(e) => setWeightUnit(e.target.value)}
                        >
                            <option value="lbs">lbs</option>
                            <option value="tons">tons</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                        </select>
                    </div>
                </label>
            </div>

            <div className='flex flex-col md:flex-row gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Equipment Condition
                    <select
                        className="rounded bg-white w-full py-1.5 px-1 border border-zinc-900/30 shadow-md"
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
                </label>

                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Coming from an auction/dealer?
                    <select
                        className="rounded w-full bg-white px-1 py-1.5 border border-zinc-900/30 shadow-md"
                        value={isAuction === null ? '' : isAuction ? 'yes' : 'no'}
                        onChange={(e) => {
                            setErrorText('');
                            setIsAuction(e.target.value === 'yes');
                        }}
                    >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </label>
            </div>

            <div className='flex flex-col gap-2'>
                <label className='text-zinc-900 dark:text-zinc-100 font-medium w-full'>Loading/Unloading Requirements
                    <input
                        className="rounded dark:text-zinc-800 w-full p-1 border border-zinc-900/30 shadow-md"
                        type="text"
                        placeholder='e.g. Tarp, Forklift, Ramp, Dock'
                        value={loadingUnloadingRequirements}
                        onChange={(e) => {
                            setErrorText('');
                            setLoadingUnloadingRequirements(e.target.value);
                        }}
                    />
                </label>
            </div>

            {isAuction && (
                <div className='flex flex-col md:flex-row gap-2'>
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
    );
};

export default EquipmentForm;