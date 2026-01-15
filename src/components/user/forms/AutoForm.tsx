import React, { useState, useEffect } from 'react';
import { Car, DollarSign, MapPin, Settings } from 'lucide-react';

interface AutoFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
    formData: any;
}

const AutoForm: React.FC<AutoFormProps> = ({
    setFormData,
    setErrorText,
    formData,
}) => {
    const [year, setYear] = useState(formData.auto_year || '');
    const [make, setMake] = useState(formData.auto_make || '');
    const [model, setModel] = useState(formData.auto_model || '');
    const [vin, setVin] = useState(formData.vin || '');
    const [operationalCondition, setOperationalCondition] = useState<boolean | null>(formData.operational_condition || null);
    const [auction, setAuction] = useState(formData.auction || '');
    const [isAuction, setIsAuction] = useState<boolean | null>(formData.is_auction || null);
    const [buyerNumber, setBuyerNumber] = useState(formData.buyer_number || '');
    const [lotNumber, setLotNumber] = useState(formData.lot_number || '');
    const [value, setValue] = useState(formData.goods_value || '');

    useEffect(() => {
        const updatedFormData = {
            auto_year: year.toString(),
            auto_make: make,
            auto_model: model,
            vin,
            operational_condition: operationalCondition,
            auction,
            buyer_number: buyerNumber,
            lot_number: lotNumber,
            goods_value: value,
        };
        setFormData((prev: any) => ({ ...prev, ...updatedFormData }));
    }, [year, make, model, vin, operationalCondition, auction, buyerNumber, lotNumber, value, setFormData]);

    return (
        <div className="space-y-8">
            {/* Vehicle Information */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Car className="w-5 h-5 text-blue-600" />
                    <h4 className="text-lg font-medium text-gray-900">Vehicle Information</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="nts-form-group">
                            <label className="nts-label">Year</label>
                            <input
                                className="nts-input"
                                type="text"
                                placeholder="2020"
                                value={year}
                                onChange={(e) => {
                                    setErrorText('');
                                    setYear(e.target.value);
                                }}
                            />
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label">Make</label>
                            <input
                                className="nts-input"
                                value={make}
                                placeholder="Toyota"
                                onChange={(e) => {
                                    setErrorText('');
                                    setMake(e.target.value);
                                }}
                            />
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label">Model</label>
                            <input
                                className="nts-input"
                                value={model}
                                placeholder="RAV4"
                                onChange={(e) => {
                                    setErrorText('');
                                    setModel(e.target.value);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Vehicle Details */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <h4 className="text-lg font-medium text-gray-900">Vehicle Details</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="nts-form-group">
                            <label className="nts-label">Vehicle Condition</label>
                            <select
                                className="nts-input"
                                title='Vehicle Condition'
                                value={operationalCondition === null ? '' : operationalCondition ? 'operable' : 'inoperable'}
                                onChange={(e) => {
                                    setErrorText('');
                                    setOperationalCondition(e.target.value === 'operable');
                                }}
                            >
                                <option value="">Select condition...</option>
                                <option value="operable">Operable (Runs & Drives)</option>
                                <option value="inoperable">Inoperable (Non-Running)</option>
                            </select>
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label">Vehicle Value</label>
                            <input
                                className="nts-input"
                                type="text"
                                value={value}
                                placeholder="$20,000"
                                onChange={(e) => {
                                    setErrorText('');
                                    setValue(e.target.value);
                                }}
                            />
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label">VIN Number</label>
                            <input
                                className="nts-input"
                                placeholder="17-digit VIN (optional)"
                                type="text"
                                value={vin}
                                onChange={(e) => {
                                    setErrorText('');
                                    setVin(e.target.value);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Auction/Dealer Information */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <h4 className="text-lg font-medium text-gray-900">Pickup Location</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="nts-form-group">
                        <label className="nts-label">Auction/Dealer Pickup?</label>
                        <select
                            className="nts-input max-w-xs"
                            title="auction/dealer pickup?"
                            value={isAuction === null ? '' : isAuction ? 'yes' : 'no'}
                            onChange={(e) => {
                                setErrorText('');
                                setIsAuction(e.target.value === 'yes');
                            }}
                        >
                            <option value="">Select...</option>
                            <option value="yes">Yes - Auction/Dealer</option>
                            <option value="no">No - Private Location</option>
                        </select>
                    </div>

                    {isAuction && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="nts-form-group">
                                <label className="nts-label">Auction/Dealer Name</label>
                                <input
                                    className="nts-input"
                                    type="text"
                                    placeholder="Copart, IAA, Manheim, etc."
                                    value={auction}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setAuction(e.target.value);
                                    }}
                                />
                            </div>
                            <div className="nts-form-group">
                                <label className="nts-label">Buyer Number</label>
                                <input
                                    className="nts-input"
                                    type="text"
                                    placeholder="Your buyer ID"
                                    value={buyerNumber}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setBuyerNumber(e.target.value);
                                    }}
                                />
                            </div>
                            <div className="nts-form-group">
                                <label className="nts-label">Lot Number</label>
                                <input
                                    className="nts-input"
                                    type="text"
                                    placeholder="Auction lot number"
                                    value={lotNumber}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setLotNumber(e.target.value);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AutoForm;
