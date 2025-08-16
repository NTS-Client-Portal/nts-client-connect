import React, { useState, useEffect } from 'react';
import { Truck, Ruler, Settings, MapPin } from 'lucide-react';

interface SemiTruckFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
}

const SemiTruckForm: React.FC<SemiTruckFormProps> = ({
    setFormData,
    setErrorText,
}) => {
    const [year, setYear] = useState('');
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState('lbs');
    const [vin, setVin] = useState('');
    const [operationalCondition, setOperationalCondition] = useState<boolean | null>(null);
    const [isAuction, setIsAuction] = useState<boolean | null>(null);
    const [auction, setAuction] = useState('');
    const [buyerNumber, setBuyerNumber] = useState('');
    const [lotNumber, setLotNumber] = useState('');
    const [loadingUnloadingRequirements, setLoadingUnloadingRequirements] = useState('');
    const [value, setValue] = useState<string | null>(null);

    useEffect(() => {
        const formData = {
            year,
            make,
            model,
            length,
            width,
            height,
            weight,
            weight_unit: weightUnit,
            vin,
            operational_condition: operationalCondition,
            is_auction: isAuction,
            auction,
            buyer_number: buyerNumber,
            lot_number: lotNumber,
            loading_unloading_requirements: loadingUnloadingRequirements,
            goods_value: value,
        };

        setFormData(formData);
    }, [year, make, model, length, width, height, weight, value, weightUnit, vin, operationalCondition, isAuction, auction, buyerNumber, lotNumber, loadingUnloadingRequirements, setFormData]);

    return (
        <div className="nts-form-container">
            {/* Truck Details Section */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Truck className="w-5 h-5 text-red-600" />
                    <h3>Truck Details</h3>
                </div>
                <div className="nts-form-section-body">
                    <div className="nts-form-grid-3">
                        <label className="nts-form-label">Year
                            <input
                                className="nts-form-input"
                                type="text"
                                placeholder="2020"
                                value={year}
                                onChange={(e) => {
                                    setErrorText('');
                                    setYear(e.target.value);
                                }}
                            />
                        </label>
                        <label className="nts-form-label">Make
                            <select
                                className="nts-form-select"
                                value={make}
                                onChange={(e) => {
                                    setErrorText('');
                                    setMake(e.target.value);
                                }}
                            >
                                <option value="">Select manufacturer...</option>
                                <option value="Freightliner">Freightliner</option>
                                <option value="Peterbilt">Peterbilt</option>
                                <option value="Kenworth">Kenworth</option>
                                <option value="Volvo">Volvo</option>
                                <option value="Mack">Mack</option>
                                <option value="International">International</option>
                                <option value="Western Star">Western Star</option>
                                <option value="Other">Other</option>
                            </select>
                        </label>
                        <label className="nts-form-label">Model
                            <input
                                className="nts-form-input"
                                type="text"
                                placeholder="Cascadia 126"
                                value={model}
                                onChange={(e) => {
                                    setErrorText('');
                                    setModel(e.target.value);
                                }}
                            />
                        </label>
                    </div>
                    <div className="nts-form-grid-2">
                        <label className="nts-form-label">Vehicle Condition
                            <select
                                className="nts-form-select"
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
                        <label className="nts-form-label">Truck Value
                            <input
                                className="nts-form-input"
                                type="text"
                                placeholder="e.g. $80,000"
                                value={value || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setValue(e.target.value);
                                }}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Dimensions & Weight Section */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Ruler className="w-5 h-5 text-green-600" />
                    <h3>Dimensions & Weight</h3>
                </div>
                <div className="nts-form-section-body">
                    <div className="nts-form-grid-4">
                        <label className="nts-form-label">Length
                            <input
                                className="nts-form-input"
                                type="text"
                                placeholder="25' 6&quot;"
                                value={length}
                                onChange={(e) => {
                                    setErrorText('');
                                    setLength(e.target.value);
                                }}
                            />
                        </label>
                        <label className="nts-form-label">Width
                            <input
                                className="nts-form-input"
                                type="text"
                                placeholder="8' 6&quot;"
                                value={width}
                                onChange={(e) => {
                                    setErrorText('');
                                    setWidth(e.target.value);
                                }}
                            />
                        </label>
                        <label className="nts-form-label">Height
                            <input
                                className="nts-form-input"
                                type="text"
                                placeholder="13' 4&quot;"
                                value={height}
                                onChange={(e) => {
                                    setErrorText('');
                                    setHeight(e.target.value);
                                }}
                            />
                        </label>
                        <div className="nts-form-unit-field">
                            <label className="nts-form-label">Weight
                                <input
                                    className="nts-form-input"
                                    type="text"
                                    placeholder="e.g. 30,000"
                                    value={weight}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setWeight(e.target.value);
                                    }}
                                />
                            </label>
                            <select
                                className="nts-form-unit-select"
                                title='weight unit selection'
                                value={weightUnit}
                                onChange={(e) => setWeightUnit(e.target.value)}
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

            {/* Auction/Dealer Information Section */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <h3>Pickup Information</h3>
                </div>
                <div className="nts-form-section-body">
                    <div className="nts-form-grid-1">
                        <label className="nts-form-label">Coming from an auction/dealer?
                            <select
                                className="nts-form-select"
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

                    {isAuction && (
                        <div className="nts-form-grid-3 mt-4">
                            <label className="nts-form-label">Auction/Dealer Name
                                <input
                                    className="nts-form-input"
                                    type="text"
                                    placeholder="Auction house or dealer name"
                                    value={auction}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setAuction(e.target.value);
                                    }}
                                />
                            </label>
                            <label className="nts-form-label">Buyer Number
                                <input
                                    className="nts-form-input"
                                    type="text"
                                    placeholder="Your buyer number"
                                    value={buyerNumber}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setBuyerNumber(e.target.value);
                                    }}
                                />
                            </label>
                            <label className="nts-form-label">Lot Number
                                <input
                                    className="nts-form-input"
                                    type="text"
                                    placeholder="Lot or item number"
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
            </div>

            {/* Special Requirements Section */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Settings className="w-5 h-5 text-orange-600" />
                    <h3>Special Requirements</h3>
                </div>
                <div className="nts-form-section-body">
                    <div className="nts-form-grid-1">
                        <label className="nts-form-label">Loading/Unloading Requirements
                            <input
                                className="nts-form-input"
                                type="text"
                                placeholder="e.g. Tarp, Forklift, Ramp, Dock"
                                value={loadingUnloadingRequirements}
                                onChange={(e) => {
                                    setErrorText('');
                                    setLoadingUnloadingRequirements(e.target.value);
                                }}
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SemiTruckForm;