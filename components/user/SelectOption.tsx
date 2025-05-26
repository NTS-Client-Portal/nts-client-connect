import React from 'react';
import EquipmentForm from './forms/EquipmentForm';
import ContainerForm from './forms/ContainerForm';
import RvTrailerForm from './forms/RvTrailerForm';
import SemiTruckForm from './forms/SemiTruckForm';
import BoatForm from './forms/BoatForm';
import { Session } from '@supabase/auth-helpers-react';
import FreightForm from './forms/FreightForm';
import AutoForm from './forms/AutoForm';

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
        <>
            <label className='text-zinc-800 label-font'>Freight Type
                <select
                    className="rounded w-full bg-white px-1 py-2 mt-2 border border-zinc-900/20 text-zinc-600"
                    value={selectedOption}
                    onChange={(e) => {
                        setErrorText('');
                        setSelectedOption(e.target.value);
                    }}
                >
                    <option value="">select...</option>
                    <option value="Equipment">Equipment/Machinery</option>
                    <option value="Containers">Containers</option>
                    <option value="Semi/Heavy Duty Trucks">Semi Trucks</option>
                    <option value="LTL/FTL">LTL/FTL</option>
                    <option value="Auto">Auto</option>
                    <option value="Trailers">Trailers/RV/Camplers</option>
                    <option value="Boats">Boats</option>
                </select>
            </label>

            {selectedOption === 'Equipment' && (
                <EquipmentForm
                    setFormData={setFormData}
                    setErrorText={setErrorText}
                    formData={formData} // Pass formData to EquipmentForm
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
        </>
    );
};

export default SelectOption;