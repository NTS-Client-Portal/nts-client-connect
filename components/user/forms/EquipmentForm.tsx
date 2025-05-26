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
    const [lengthUnit, setLengthUnit] = useState(formData.length_unit || 'ft');
    const [width, setWidth] = useState(formData.width || '');
    const [widthUnit, setWidthUnit] = useState(formData.width_unit || 'ft');
    const [height, setHeight] = useState(formData.height || '');
    const [heightUnit, setHeightUnit] = useState(formData.height_unit || 'ft');
    const [weight, setWeight] = useState(formData.weight || '');
    const [weightUnit, setWeightUnit] = useState(formData.weight_unit || 'lbs');
    const [operationalCondition, setOperationalCondition] = useState<boolean | null>(formData.operational_condition || null);
    const [loadingUnloadingRequirements, setLoadingUnloadingRequirements] = useState(formData.loading_unloading_requirements || '');
    const [tarping, setTarping] = useState<boolean | null>(formData.tarping || null);
    const [isAuction, setIsAuction] = useState<boolean | null>(formData.is_auction || null);
    const [auction, setAuction] = useState(formData.auction || '');
    const [buyerNumber, setBuyerNumber] = useState(formData.buyer_number || '');
    const [lotNumber, setLotNumber] = useState(formData.lot_number || '');
    const [value, setValue] = useState(formData.value || '');
    const [vin, setVin] = useState(formData.vin || '');

    useEffect(() => {
        const updatedFormData = {
            year: year.toString(),
            make,
            model,
            vin,
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
            goods_value: value.toString(),
        };
        setFormData(updatedFormData);
    }, [year, make, model, vin, length, value, lengthUnit, width, widthUnit, height, heightUnit, weight, weightUnit, operationalCondition, loadingUnloadingRequirements, tarping, isAuction, auction, buyerNumber, lotNumber, setFormData]);

    return (
        <div className="bg-white w-full space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-ntsBlue mb-2">Equipment Details</h1>
                <p className="text-zinc-500 dark:text-zinc-300 text-sm">Please provide accurate information for the best shipping estimate.</p>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Year</label>
                    <input
                        className="form-input"
                        type="text"
                        placeholder="2020"
                        value={year}
                        onChange={e => { setErrorText(''); setYear(e.target.value); }}
                    />
                </div>
                <div>
                    <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Make</label>
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Caterpillar"
                        value={make}
                        onChange={e => { setErrorText(''); setMake(e.target.value); }}
                    />
                </div>
                <div>
                    <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Model</label>
                    <input
                        className="form-input"
                        type="text"
                        placeholder="D8T"
                        value={model}
                        onChange={e => { setErrorText(''); setModel(e.target.value); }}
                    />
                </div>
                <div>
                    <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Equipment Value</label>
                    <input
                        className="form-input"
                        type="text"
                        placeholder="e.g. $55,000"
                        value={value}
                        onChange={e => { setErrorText(''); setValue(e.target.value); }}
                    />
                </div>
            </div>

            {/* Dimensions */}
            <div>
                <h2 className="text-lg font-semibold mb-2">Dimensions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Length */}
                    <div>
                        <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Length</label>
                        <div className="flex">
                            <input
                                className="form-input rounded-r-none"
                                type="number"
                                min="0"
                                placeholder="Length"
                                value={length}
                                onChange={e => { setErrorText(''); setLength(e.target.value); }}
                            />
                            <select
                                className="form-input rounded-l-none border-l-0 w-24"
                                value={lengthUnit}
                                onChange={e => setLengthUnit(e.target.value)}
                            >
                                <option value="ft">ft</option>
                                <option value="in">in</option>
                            </select>
                        </div>
                    </div>
                    {/* Width */}
                    <div>
                        <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Width</label>
                        <div className="flex">
                            <input
                                className="form-input rounded-r-none"
                                type="number"
                                min="0"
                                placeholder="Width"
                                value={width}
                                onChange={e => { setErrorText(''); setWidth(e.target.value); }}
                            />
                            <select
                                className="form-input rounded-l-none border-l-0 w-24"
                                value={widthUnit}
                                onChange={e => setWidthUnit(e.target.value)}
                            >
                                <option value="ft">ft</option>
                                <option value="in">in</option>
                            </select>
                        </div>
                    </div>
                    {/* Height */}
                    <div>
                        <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Height</label>
                        <div className="flex">
                            <input
                                className="form-input rounded-r-none"
                                type="number"
                                min="0"
                                placeholder="Height"
                                value={height}
                                onChange={e => { setErrorText(''); setHeight(e.target.value); }}
                            />
                            <select
                                className="form-input rounded-l-none border-l-0 w-24"
                                value={heightUnit}
                                onChange={e => setHeightUnit(e.target.value)}
                            >
                                <option value="ft">ft</option>
                                <option value="in">in</option>
                            </select>
                        </div>
                    </div>
                    {/* Weight */}
                    <div>
                        <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Weight</label>
                        <div className="flex">
                            <input
                                className="form-input rounded-r-none"
                                type="number"
                                min="0"
                                placeholder="e.g. 30,000"
                                value={weight}
                                onChange={e => { setErrorText(''); setWeight(e.target.value); }}
                            />
                            <select
                                className="form-input rounded-l-none border-l-0 w-24"
                                value={weightUnit}
                                onChange={e => setWeightUnit(e.target.value)}
                            >
                                <option value="lbs">lbs</option>
                                <option value="tons">tons</option>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Condition, VIN, Auction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Equipment Condition</label>
                    <select
                        className="input"
                        value={operationalCondition === null ? '' : operationalCondition ? 'operable' : 'inoperable'}
                        onChange={e => {
                            setErrorText('');
                            setOperationalCondition(e.target.value === 'operable');
                        }}
                    >
                        <option value="">Select...</option>
                        <option value="operable">Operable</option>
                        <option value="inoperable">Inoperable</option>
                    </select>
                </div>
                <div>
                    <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">VIN Number</label>
                    <input
                        className="input"
                        type="text"
                        placeholder="VIN"
                        value={vin}
                        onChange={e => { setErrorText(''); setVin(e.target.value); }}
                    />
                </div>
                <div>
                    <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Coming from an auction/dealer?</label>
                    <select
                        className="input"
                        value={isAuction === null ? '' : isAuction ? 'yes' : 'no'}
                        onChange={e => {
                            setErrorText('');
                            setIsAuction(e.target.value === 'yes');
                        }}
                    >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </div>
            </div>

            {/* Auction Details */}
            {isAuction && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Auction/Dealer Name</label>
                        <input
                            className="input"
                            type="text"
                            value={auction}
                            onChange={e => { setErrorText(''); setAuction(e.target.value); }}
                        />
                    </div>
                    <div>
                        <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Buyer Number</label>
                        <input
                            className="input"
                            type="text"
                            value={buyerNumber}
                            onChange={e => { setErrorText(''); setBuyerNumber(e.target.value); }}
                        />
                    </div>
                    <div>
                        <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Lot Number</label>
                        <input
                            className="input"
                            type="text"
                            value={lotNumber}
                            onChange={e => { setErrorText(''); setLotNumber(e.target.value); }}
                        />
                    </div>
                </div>
            )}

            {/* Loading/Unloading */}
            <div>
                <label className="block text-zinc-900 dark:text-zinc-100 font-medium mb-1">Loading/Unloading Requirements</label>
                <input
                    className="input"
                    type="text"
                    placeholder="e.g. Tarp, Forklift, Ramp, Dock"
                    value={loadingUnloadingRequirements}
                    onChange={e => { setErrorText(''); setLoadingUnloadingRequirements(e.target.value); }}
                />
            </div>
        </div>
    );
};

// Tailwind utility for consistent input styling
// Add this to your global CSS or Tailwind config if you want to reuse
// .input { @apply rounded w-full p-2 border border-zinc-900/30 shadow-md dark:text-zinc-800 bg-white dark:bg-zinc-800; }

export default EquipmentForm;