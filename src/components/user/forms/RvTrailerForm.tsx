import React, { useState, useEffect } from 'react';
import { Home, Ruler, Car, Settings } from 'lucide-react';

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
        <div className="nts-form-container">
            {/* RV/Trailer Details Section */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Home className="w-5 h-5 text-orange-600" />
                    <h3>RV/Trailer Details</h3>
                </div>
                <div className="nts-form-section-body">
                    <div className="nts-form-grid-3">
                        <label className="nts-form-label">Year
                            <input
                                className="nts-form-input"
                                type="number"
                                placeholder="2015"
                                value={year || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setYear(e.target.value ? parseInt(e.target.value) : null);
                                }}
                            />
                        </label>
                        <label className="nts-form-label">Make
                            <input
                                className="nts-form-input"
                                placeholder="Winnebago, Fleetwood, etc."
                                type="text"
                                value={make || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setMake(e.target.value);
                                }}
                            />
                        </label>
                        <label className="nts-form-label">Model
                            <input
                                className="nts-form-input"
                                type="text"
                                placeholder="Brave, Bounder, etc."
                                value={model || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setModel(e.target.value);
                                }}
                            />
                        </label>
                    </div>
                    <div className="nts-form-grid-2">
                        <label className="nts-form-label">Class Type (if applicable)
                            <select
                                className="nts-form-select"
                                value={classType || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setClassType(e.target.value);
                                }}
                            >
                                <option value="">Select class...</option>
                                <option value="Class A">Class A - Large Motorhome</option>
                                <option value="Class B">Class B - Van Conversion</option>
                                <option value="Class C">Class C - Cab-Over</option>
                                <option value="Travel Trailer">Travel Trailer</option>
                                <option value="Fifth Wheel">Fifth Wheel</option>
                                <option value="Pop-up Camper">Pop-up Camper</option>
                                <option value="Toy Hauler">Toy Hauler</option>
                                <option value="Park Model">Park Model</option>
                                <option value="Other">Other</option>
                            </select>
                        </label>
                        <label className="nts-form-label">RV Value
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
                        <div className="nts-form-unit-field">
                            <label className="nts-form-label">Length
                                <input
                                    className="nts-form-input"
                                    type="text"
                                    placeholder="e.g. 30ft"
                                    value={length || ''}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setLength(e.target.value);
                                    }}
                                />
                            </label>
                            <select 
                                className="nts-form-unit-select"
                                title='length unit selection'
                                value={lengthUnit}
                                onChange={(e) => {
                                    setErrorText('');
                                    setLengthUnit(e.target.value);
                                }}
                            >
                                <option value="ft">Feet</option>
                                <option value="in">Inches</option>
                                <option value="m">Meters</option>
                                <option value="mm">Millimeters</option>
                            </select>
                        </div>
                        <div className="nts-form-unit-field">
                            <label className="nts-form-label">Width
                                <input
                                    className="nts-form-input"
                                    type="text"
                                    placeholder="e.g. 8ft"
                                    value={width || ''}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setWidth(e.target.value);
                                    }}
                                />
                            </label>
                            <select 
                                className="nts-form-unit-select"
                                title="width unit selection"
                                value={widthUnit}
                                onChange={(e) => {
                                    setErrorText('');
                                    setWidthUnit(e.target.value);
                                }}
                            >
                                <option value="ft">Feet</option>
                                <option value="in">Inches</option>
                                <option value="m">Meters</option>
                                <option value="mm">Millimeters</option>
                            </select>
                        </div>
                        <div className="nts-form-unit-field">
                            <label className="nts-form-label">Height
                                <input
                                    className="nts-form-input"
                                    type="text"
                                    placeholder="e.g. 9ft"
                                    value={height || ''}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setHeight(e.target.value);
                                    }}
                                />
                            </label>
                            <select 
                                className="nts-form-unit-select"
                                title="height unit selection"
                                value={heightUnit}
                                onChange={(e) => {
                                    setErrorText('');
                                    setHeightUnit(e.target.value);
                                }}
                            >
                                <option value="ft">Feet</option>
                                <option value="in">Inches</option>
                                <option value="m">Meters</option>
                                <option value="mm">Millimeters</option>
                            </select>
                        </div>
                        <div className="nts-form-unit-field">
                            <label className="nts-form-label">Weight
                                <input
                                    className="nts-form-input"
                                    type="text"
                                    placeholder="e.g. 20,000"
                                    value={weight || ''}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setWeight(e.target.value);
                                    }}
                                />
                            </label>
                            <select 
                                className="nts-form-unit-select"
                                title="weight unit selection"
                                value={weightUnit}
                                onChange={(e) => {
                                    setErrorText('');
                                    setWeightUnit(e.target.value);
                                }}
                            >
                                <option value="lbs">Pounds</option>
                                <option value="kg">Kilograms</option>
                                <option value="tons">Tons</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Condition & Transport Section */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Car className="w-5 h-5 text-blue-600" />
                    <h3>Condition & Transport</h3>
                </div>
                <div className="nts-form-section-body">
                    <div className="nts-form-grid-3">
                        <label className="nts-form-label">Vehicle Condition
                            <select
                                className="nts-form-select"
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
                        <label className="nts-form-label">Hitch Type (if applicable)
                            <select
                                className="nts-form-select"
                                value={motorizedOrTrailer || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setMotorizedOrTrailer(e.target.value);
                                }}
                            >
                                <option value="">Select hitch type...</option>
                                <option value="5th Wheel">5th Wheel</option>
                                <option value="Gooseneck">Gooseneck</option>
                                <option value="Bumper Pull">Bumper Pull</option>
                                <option value="Pintle Hitch">Pintle Hitch</option>
                                <option value="Weight Distribution">Weight Distribution</option>
                                <option value="Motorized - N/A">Motorized - N/A</option>
                                <option value="Other">Other</option>
                            </select>
                        </label>
                        <label className="nts-form-label">VIN (Optional)
                            <input
                                className="nts-form-input"
                                type="text"
                                placeholder="Vehicle Identification Number"
                                value={vin || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setVin(e.target.value);
                                }}
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RvTrailerForm;