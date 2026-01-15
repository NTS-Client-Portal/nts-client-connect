import React, { useState, useEffect } from 'react';
import { Anchor, Ruler, Ship, MapPin } from 'lucide-react';

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
    const [widthUnit, setWidthUnit] = useState<string | null>(null);
    const [weightUnit, setWeightUnit] = useState<string | null>(null);
    const [year, setYear] = useState<string | null>(null);
    const [make, setMake] = useState<string | null>(null);
    const [model, setModel] = useState<string | null>(null);
    const [trailer, setTrailer] = useState<string | null>(null);
    const [boatType, setBoatType] = useState<string | null>(null);
    const [weight, setWeight] = useState<string | null>(null);
    const [value, setValue] = useState<string | null>(null);

    useEffect(() => {
        const formData = {
            beam,
            cradle: cradle === 'yes',
            height,
            length,
            trailer: trailer === 'yes',
            type: boatType,
            weight,
            year,
            make,
            model,
            length_unit: lengthUnit,
            height_unit: heightUnit,
            width_unit: widthUnit,
            weight_unit: weightUnit,
            goods_value: value,
        };

        setFormData(formData);
    }, [beam, year, make, model, weightUnit, widthUnit, lengthUnit, heightUnit, cradle, height, length, value, trailer, boatType, weight, setFormData]);

    return (
        <div className="nts-form-container">
            {/* Vessel Details Section */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Anchor className="w-5 h-5 text-blue-600" />
                    <h3>Vessel Details</h3>
                </div>
                <div className="nts-form-section-body">
                    <div className="nts-form-grid-3">
                        <label className="nts-form-label">Year
                            <input
                                className="nts-form-input"
                                type="text"
                                placeholder="e.g. 2020"
                                value={year || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setYear(e.target.value);
                                }}
                            />
                        </label>
                        <label className="nts-form-label">Manufacturer
                            <input
                                className="nts-form-input"
                                placeholder="Bayliner, Sea Ray, etc."
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
                                placeholder="185 Bowrider, 240 Sundancer, etc."
                                value={model || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setModel(e.target.value);
                                }}
                            />
                        </label>
                    </div>
                    <div className="nts-form-grid-2">
                        <label className="nts-form-label">Boat Type
                            <select
                                className="nts-form-select"
                                value={boatType || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setBoatType(e.target.value);
                                }}
                            >
                                <option value="">Select boat type...</option>
                                <option value="Sailboat">Sailboat</option>
                                <option value="Motor Yacht">Motor Yacht</option>
                                <option value="Fishing Boat">Fishing Boat</option>
                                <option value="Pontoon">Pontoon</option>
                                <option value="Cabin Cruiser">Cabin Cruiser</option>
                                <option value="Bowrider">Bowrider</option>
                                <option value="Center Console">Center Console</option>
                                <option value="Catamaran">Catamaran</option>
                                <option value="Houseboat">Houseboat</option>
                                <option value="Personal Watercraft">Personal Watercraft</option>
                                <option value="Other">Other</option>
                            </select>
                        </label>
                        <label className="nts-form-label">Vessel Value
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
                                    placeholder="20' 6&quot;"
                                    value={length || ''}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setLength(e.target.value);
                                    }}
                                />
                            </label>
                            <select 
                                className="nts-form-unit-select"
                                title="length unit select"
                                value={lengthUnit || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setLengthUnit(e.target.value);
                                }}
                            >
                                <option value="">Unit</option>
                                <option value="ft">Feet</option>
                                <option value="m">Meters</option>
                            </select>
                        </div>
                        <div className="nts-form-unit-field">
                            <label className="nts-form-label">Beam (Width)
                                <input
                                    className="nts-form-input"
                                    type="text"
                                    placeholder="8' 6&quot;"
                                    value={beam || ''}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setBeam(e.target.value);
                                    }}
                                />
                            </label>
                            <select 
                                className="nts-form-unit-select"
                                title="width unit select"
                                value={widthUnit || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setWidthUnit(e.target.value);
                                }}
                            >
                                <option value="">Unit</option>
                                <option value="ft">Feet</option>
                                <option value="m">Meters</option>
                            </select>
                        </div>
                        <div className="nts-form-unit-field">
                            <label className="nts-form-label">Height
                                <input
                                    className="nts-form-input"
                                    type="text"
                                    placeholder="9' 6&quot;"
                                    value={height || ''}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setHeight(e.target.value);
                                    }}
                                />
                            </label>
                            <select 
                                className="nts-form-unit-select"
                                title="height unit select"
                                value={heightUnit || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setHeightUnit(e.target.value);
                                }}
                            >
                                <option value="">Unit</option>
                                <option value="ft">Feet</option>
                                <option value="m">Meters</option>
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
                                title="weight unit select"
                                value={weightUnit || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setWeightUnit(e.target.value);
                                }}
                            >
                                <option value="">Unit</option>
                                <option value="lbs">Pounds</option>
                                <option value="kg">Kilograms</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transport Requirements Section */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Ship className="w-5 h-5 text-purple-600" />
                    <h3>Transport Requirements</h3>
                </div>
                <div className="nts-form-section-body">
                    <div className="nts-form-grid-2">
                        <label className="nts-form-label">On Trailer?
                            <select
                                className="nts-form-select"
                                value={trailer || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setTrailer(e.target.value);
                                }}
                                title="On Trailer"
                            >
                                <option value="">Select...</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </label>
                        <label className="nts-form-label">Cradle Needed?
                            <select
                                className="nts-form-select"
                                value={cradle || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setCradle(e.target.value);
                                }}
                                aria-label="Cradle Needed"
                                title="Cradle Needed"
                            >
                                <option value="">Select...</option>
                                <option value="yes">Yes - Need cradle/support</option>
                                <option value="no">No - Self-supporting</option>
                            </select>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoatForm;