import React, { useState, useEffect } from 'react';
import { Wrench, DollarSign, Ruler, Settings, MapPin } from 'lucide-react';

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
        <div className="space-y-8">
            {/* Basic Equipment Information */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Wrench className="w-5 h-5 text-orange-600" />
                    <h4 className="text-lg font-medium text-gray-900">Equipment Details</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="nts-form-group">
                            <label className="nts-label">Year</label>
                            <input
                                className="nts-input"
                                type="text"
                                placeholder="2020"
                                value={year}
                                onChange={e => { setErrorText(''); setYear(e.target.value); }}
                            />
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label">Make</label>
                            <input
                                className="nts-input"
                                type="text"
                                placeholder="Caterpillar"
                                value={make}
                                onChange={e => { setErrorText(''); setMake(e.target.value); }}
                            />
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label">Model</label>
                            <input
                                className="nts-input"
                                type="text"
                                placeholder="D8T"
                                value={model}
                                onChange={e => { setErrorText(''); setModel(e.target.value); }}
                            />
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label">VIN/Serial Number<span className='text-gray-500'>(optional)</span></label>
                            <input
                                className="nts-input"
                                type="text"
                                placeholder="Equipment VIN or Serial Number"
                                value={vin}
                                onChange={e => { setErrorText(''); setVin(e.target.value); }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Dimensions */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Ruler className="w-5 h-5 text-blue-600" />
                    <h4 className="text-lg font-medium text-gray-900">Dimensions & Weight</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Length */}
                        <div className="nts-form-group">
                            <label className="nts-label">Length</label>
                            <div className="flex gap-1">
                                <input
                                    className="nts-input rounded-r-none flex-1 w-10"
                                    type="text"
                                    placeholder="Length"
                                    value={length}
                                    onChange={e => { setErrorText(''); setLength(e.target.value); }}
                                />
                                <select
                                    className="nts-input rounded-l-none border-l-0 w-min! shrink-0 text-xs px-1"
                                    title='length unit selection'
                                    value={lengthUnit}
                                    onChange={e => setLengthUnit(e.target.value)}
                                >
                                    <option value="ft">ft</option>
                                    <option value="in">in</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Width */}
                        <div className="nts-form-group">
                            <label className="nts-label">Width</label>
                            <div className="flex gap-1">
                                <input
                                    className="nts-input rounded-r-none flex-1 w-10"
                                    type="text"
                                    placeholder="Width"
                                    value={width}
                                    onChange={e => { setErrorText(''); setWidth(e.target.value); }}
                                />
                                <select
                                    className="nts-input rounded-l-none border-l-0 w-min! shrink-0 text-xs px-1"
                                    title='width unit selection'
                                    value={widthUnit}
                                    onChange={e => setWidthUnit(e.target.value)}
                                >
                                    <option value="ft">ft</option>
                                    <option value="in">in</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Height */}
                        <div className="nts-form-group">
                            <label className="nts-label">Height</label>
                            <div className="flex gap-1">
                                <input
                                    className="nts-input rounded-r-none flex-1 w-10"
                                    type="text"
                                    placeholder="Height"
                                    value={height}
                                    onChange={e => { setErrorText(''); setHeight(e.target.value); }}
                                />
                                <select
                                    className="nts-input rounded-l-none border-l-0 w-min! shrink-0 text-xs px-1"
                                    title='height unit selection'
                                    value={heightUnit}
                                    onChange={e => setHeightUnit(e.target.value)}
                                >
                                    <option value="ft">ft</option>
                                    <option value="in">in</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Weight */}
                        <div className="nts-form-group">
                            <label className="nts-label">Weight</label>
                            <div className="flex gap-1 w-full">
                                <input
                                    className="nts-input rounded-r-none flex-1 w-10"
                                    type="text"
                                    placeholder="30000"
                                    value={weight}
                                    onChange={e => { setErrorText(''); setWeight(e.target.value); }}
                                />
                                <select
                                    className="nts-input rounded-l-none border-l-0 w-min! shrink-0 text-xs px-1"
                                    title='weight unit selection'
                                    value={weightUnit}
                                    onChange={e => setWeightUnit(e.target.value)}
                                >
                                    <option value="lbs">lbs</option>
                                    <option value="tons">tons</option>
                                    <option value="kg">kg</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Condition & Value */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h4 className="text-lg font-medium text-gray-900">Condition & Value</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="nts-form-group">
                            <label className="nts-label">Equipment Condition</label>
                            <select
                                className="nts-input"
                                title='operational condition selection'
                                value={operationalCondition === null ? '' : operationalCondition ? 'operable' : 'inoperable'}
                                onChange={e => {
                                    setErrorText('');
                                    setOperationalCondition(e.target.value === 'operable');
                                }}
                            >
                                <option value="">Select condition...</option>
                                <option value="operable">Operable</option>
                                <option value="inoperable">Inoperable</option>
                            </select>
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label">Equipment Value<span className='text-gray-500'>(optional)</span></label>
                            <input
                                className="nts-input"
                                type="text"
                                placeholder="$55,000"
                                value={value}
                                onChange={e => { setErrorText(''); setValue(e.target.value); }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Auction Information */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <h4 className="text-lg font-medium text-gray-900">Auction/Dealer Information</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="nts-form-group">
                        <label className="nts-label">Coming from an auction/dealer?</label>
                        <select
                            className="nts-input max-w-xs"
                            title='auction dealer selection'
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

                    {isAuction && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="nts-form-group">
                                <label className="nts-label">Auction/Dealer Name</label>
                                <input
                                    className="nts-input"
                                    type="text"
                                    placeholder="Ritchie Bros, IronPlanet, etc."
                                    value={auction}
                                    onChange={e => { setErrorText(''); setAuction(e.target.value); }}
                                />
                            </div>
                            <div className="nts-form-group">
                                <label className="nts-label">Buyer Number</label>
                                <input
                                    className="nts-input"
                                    type="text"
                                    placeholder="Your buyer ID"
                                    value={buyerNumber}
                                    onChange={e => { setErrorText(''); setBuyerNumber(e.target.value); }}
                                />
                            </div>
                            <div className="nts-form-group">
                                <label className="nts-label">Lot Number</label>
                                <input
                                    className="nts-input"
                                    type="text"
                                    placeholder="Auction lot number"
                                    value={lotNumber}
                                    onChange={e => { setErrorText(''); setLotNumber(e.target.value); }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Requirements */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <h4 className="text-lg font-medium text-gray-900">Special Requirements</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="nts-form-group">
                        <label className="nts-label">Loading/Unloading Requirements</label>
                        <input
                            className="nts-input"
                            type="text"
                            placeholder="e.g. Crane, Forklift, Ramp, Loading Dock"
                            value={loadingUnloadingRequirements}
                            onChange={e => { setErrorText(''); setLoadingUnloadingRequirements(e.target.value); }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Specify any special equipment needed for loading/unloading
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Tailwind utility for consistent input styling
// Add this to your global CSS or Tailwind config if you want to reuse
// .input { @apply rounded w-full p-2 border border-zinc-900/30 shadow-md dark:text-zinc-800 bg-white dark:bg-zinc-800; }

export default EquipmentForm;