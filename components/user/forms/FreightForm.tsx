import React, { useState, useEffect } from 'react';
import { Package, Ruler, DollarSign, Truck } from 'lucide-react';

interface FreightFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
}

const FreightForm: React.FC<FreightFormProps> = ({
    setFormData,
    setErrorText,
}) => {
    const [loadDescription, setLoadDescription] = useState('');
    const [length, setLength] = useState('');
    const [lengthUnit, setLengthUnit] = useState('ft');
    const [height, setHeight] = useState('');
    const [heightUnit, setHeightUnit] = useState('ft');
    const [width, setWidth] = useState('');
    const [widthUnit, setWidthUnit] = useState('ft');
    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState('lbs');
    const [freightClass, setFreightClass] = useState('');
    const [loadingAssistance, setLoadingAssistance] = useState('');
    const [packagingType, setPackagingType] = useState('');
    const [weightPerPalletUnit, setWeightPerPalletUnit] = useState('');
    const [dockNoDock, setDockNoDock] = useState('');
    const [value, setValue] = useState('');

    useEffect(() => {
        const formData = {
            commodity: loadDescription,
            length,
            width,
            height,
            weight,
            weight_unit: weightUnit,
            freight_class: freightClass,
            loading_assistance: loadingAssistance,
            packaging_type: packagingType,
            weight_per_pallet_unit: weightPerPalletUnit,
            dock_no_dock: dockNoDock,
            goods_value: value,
        };

        setFormData(formData);
    }, [loadDescription, length, height, width, value, weight, weightUnit, freightClass, loadingAssistance, packagingType, weightPerPalletUnit, dockNoDock, setFormData]);

    return (
        <div className="space-y-8">
            {/* Freight Description */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Package className="w-5 h-5 text-green-600" />
                    <h4 className="text-lg font-medium text-gray-900">Freight Details</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="nts-form-group">
                            <label className="nts-label">Freight Description</label>
                            <input
                                className="nts-input"
                                type="text"
                                placeholder="e.g. footwear, auto parts, electronics"
                                value={loadDescription}
                                onChange={(e) => {
                                    setErrorText('');
                                    setLoadDescription(e.target.value);
                                }}
                            />
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label">Packaging Type</label>
                            <input
                                className="nts-input"
                                placeholder="e.g. pallet, skid, crate, box"
                                type="text"
                                value={packagingType}
                                onChange={(e) => {
                                    setErrorText('');
                                    setPackagingType(e.target.value);
                                }}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Length */}
                        <div className="nts-form-group">
                            <label className="nts-label">Length</label>
                            <div className="flex">
                                <input
                                    className="nts-input rounded-r-none flex-1"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    placeholder="48"
                                    value={length}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setLength(e.target.value);
                                    }}
                                />
                                <select className="nts-input rounded-l-none border-l-0 w-16"
                                    title='length unit selection'
                                    value={lengthUnit} onChange={(e) => setLengthUnit(e.target.value)}>
                                    <option value="ft">ft</option>
                                    <option value="in">in</option>
                                </select>
                            </div>
                        </div>

                        {/* Width */}
                        <div className="nts-form-group">
                            <label className="nts-label">Width</label>
                            <div className="flex">
                                <input
                                    className="nts-input rounded-r-none flex-1"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    placeholder="48"
                                    value={width}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setWidth(e.target.value);
                                    }}
                                />
                                <select className="nts-input rounded-l-none border-l-0 w-16" 
                                    title='width unit selection'
                                    value={widthUnit} onChange={(e) => setWidthUnit(e.target.value)}>
                                    <option value="ft">ft</option>
                                    <option value="in">in</option>
                                </select>
                            </div>
                        </div>

                        {/* Height */}
                        <div className="nts-form-group">
                            <label className="nts-label">Height</label>
                            <div className="flex">
                                <input
                                    className="nts-input rounded-r-none flex-1"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    placeholder="48"
                                    value={height}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setHeight(e.target.value);
                                    }}
                                />
                                <select className="nts-input rounded-l-none border-l-0 w-16"
                                    title='height unit selection'
                                    value={heightUnit} onChange={(e) => setHeightUnit(e.target.value)}>
                                    <option value="ft">ft</option>
                                    <option value="in">in</option>
                                </select>
                            </div>
                        </div>

                        {/* Weight */}
                        <div className="nts-form-group">
                            <label className="nts-label">Weight Per Unit</label>
                            <div className="flex">
                                <input
                                    className="nts-input rounded-r-none flex-1"
                                    type="number"
                                    min="0"
                                    placeholder="1500"
                                    value={weight}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setWeight(e.target.value);
                                    }}
                                />
                                <select className="nts-input rounded-l-none border-l-0 w-16" 
                                    title='weight unit selection'
                                    value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)}>
                                    <option value="lbs">lbs</option>
                                    <option value="kg">kg</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Value & Classification */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h4 className="text-lg font-medium text-gray-900">Value & Classification</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="nts-form-group">
                            <label className="nts-label">Total Freight Value</label>
                            <input
                                className="nts-input"
                                type="text"
                                placeholder="$20,000"
                                value={value}
                                onChange={(e) => {
                                    setErrorText('');
                                    setValue(e.target.value);
                                }}
                            />
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label">Freight Class</label>
                            <input
                                className="nts-input"
                                type="text"
                                placeholder="e.g. 125, 150, 175 (optional)"
                                value={freightClass}
                                onChange={(e) => {
                                    setErrorText('');
                                    setFreightClass(e.target.value);
                                }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 If unknown, leave blank - we'll help determine this
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading Requirements */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Truck className="w-5 h-5 text-purple-600" />
                    <h4 className="text-lg font-medium text-gray-900">Loading & Delivery Requirements</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="nts-form-group">
                            <label className="nts-label">Lift Gate Required</label>
                            <select
                                className="nts-input"
                                title='Is Lift Gate Required?'
                                value={loadingAssistance}
                                onChange={(e) => {
                                    setErrorText('');
                                    setLoadingAssistance(e.target.value);
                                }}
                            >
                                <option value="">Select...</option>
                                <option value="At Origin">At Origin Only</option>
                                <option value="At Destination">At Destination Only</option>
                                <option value="Both Origin and Destination">Both Locations</option>
                            </select>
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label">Loading Dock Available</label>
                            <select
                                className="nts-input"
                                title="dock or no dock available"
                                value={dockNoDock}
                                onChange={(e) => {
                                    setErrorText('');
                                    setDockNoDock(e.target.value);
                                }}
                            >
                                <option value="">Select...</option>
                                <option value="At Origin">At Origin Only</option>
                                <option value="At Destination">At Destination Only</option>
                                <option value="Both Origin and Destination">Both Locations</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default FreightForm;