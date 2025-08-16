import React from 'react';
import EquipmentForm from './forms/EquipmentForm';
import ContainerForm from './forms/ContainerForm';
import RvTrailerForm from './forms/RvTrailerForm';
import SemiTruckForm from './forms/SemiTruckForm';
import BoatForm from './forms/BoatForm';
import FreightForm from './forms/FreightForm';
import { Session } from '@supabase/auth-helpers-react';
import AutoForm from './forms/AutoForm';
import { Package } from 'lucide-react';

interface SelectOptionProps {
    selectedOption: string;
    setSelectedOption: (value: string) => void;
    setErrorText: (value: string) => void;
    session: Session;
    setFormData: (data: any) => void;
    formData: any; // Add formData prop
    disabled: boolean;
}

const SelectOption: React.FC<SelectOptionProps> = ({
    selectedOption,
    setSelectedOption,
    setErrorText,
    session,
    setFormData,
    formData, // Add formData prop
}) => {
    return (
        <div className="nts-form-section">
            <div className="nts-form-section-header">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Freight Type</h3>
            </div>
            <div className="nts-form-section-body space-y-6">
                <div className="nts-form-group">
                    <label className="nts-label" htmlFor="freight-category-select">Select Freight Category</label>
                    <select
                        id="freight-category-select"
                        className="nts-input"
                        value={selectedOption}
                        onChange={(e) => {
                            setErrorText('');
                            setSelectedOption(e.target.value);
                        }}
                    >
                        <option value="">Choose freight type...</option>
                        <option value="Equipment">Equipment/Machinery</option>
                        <option value="Containers">Containers</option>
                        <option value="Semi/Heavy Duty Trucks">Semi Trucks</option>
                        <option value="LTL/FTL">LTL/FTL</option>
                        <option value="Auto">Auto</option>
                        <option value="Trailers">Trailers/RV/Campers</option>
                        <option value="Boats">Boats</option>
                    </select>
                </div>

                {selectedOption === 'Equipment' && (
                    <EquipmentForm
                        setFormData={setFormData}
                        setErrorText={setErrorText}
                        formData={formData}
                    />
                )}

                {selectedOption === 'LTL/FTL' && (
                    <FreightForm
                        setFormData={setFormData}
                        setErrorText={setErrorText}
                    />
                )}

                {selectedOption === 'Containers' && (
                    <ContainerForm
                        setFormData={setFormData}
                        setErrorText={setErrorText}
                    />
                )}

                {selectedOption === 'Trailers' && (
                    <RvTrailerForm
                        setFormData={setFormData}
                        setErrorText={setErrorText}
                    />
                )}

                {selectedOption === 'Semi/Heavy Duty Trucks' && (
                    <SemiTruckForm
                        setFormData={setFormData}
                        setErrorText={setErrorText}
                    />
                )}

                {selectedOption === 'Auto' && (
                    <AutoForm
                        setFormData={setFormData}
                        setErrorText={setErrorText}
                        formData={formData}
                    />
                )}

                {selectedOption === 'Boats' && (
                    <BoatForm
                        setFormData={setFormData}
                        setErrorText={setErrorText}
                    />
                )}
            </div>
        </div>
    );
};

export default SelectOption;