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
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Select a Freight Type
                <select
                    className="rounded w-full bg-white p-1 py-1.5 border border-zinc-900/30 shadow-md text-zinc-600"
                    value={selectedOption}
                    onChange={(e) => {
                        setErrorText('');
                        setSelectedOption(e.target.value);
                    }}
                >
                    <option value="">select...</option>
                    <option value="equipment">Equipment/Machinery</option>
                    <option value="containers">Containers</option>
                    <option value="semi_trucks">Semi Trucks</option>
                    <option value="ltl_ftl">LTL/FTL</option>
                    <option value="auto">Auto</option>
                    <option value="rv_trailers">Trailers/RV/Camplers</option>
                    <option value="boats">Boats</option>
                </select>
            </label>

            {selectedOption === 'equipment' && (
                <EquipmentForm
                    setFormData={setFormData}
                    setErrorText={setErrorText}
                    formData={formData} // Pass formData to EquipmentForm
                />
            )}

            {selectedOption === 'ltl_ftl' && (
                <FreightForm
                    setFormData={setFormData}
                    setErrorText={setErrorText}
                />
            )}

            {selectedOption === 'containers' && (
                <ContainerForm
                    setFormData={setFormData}
                    setErrorText={setErrorText}
                />
            )}

            {selectedOption === 'rv_trailers' && (
                <RvTrailerForm
                    setFormData={setFormData}
                    setErrorText={setErrorText}
                />
            )}

            {selectedOption === 'semi_trucks' && (
                <SemiTruckForm
                    setFormData={setFormData}
                    setErrorText={setErrorText}
                />
            )}
            {selectedOption === 'auto' && (
                <AutoForm
                    setFormData={setFormData}
                    setErrorText={setErrorText}
                />
            )}

            {selectedOption === 'boats' && (
                <BoatForm
                    setFormData={setFormData}
                    setErrorText={setErrorText}
                />
            )}
        </>
    );
};

export default SelectOption;