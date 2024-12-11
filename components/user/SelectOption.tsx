import React from 'react';
import EquipmentForm from './quotetabs/forms/EquipmentForm';
import ContainerForm from './quotetabs/forms/ContainerForm';
import RvTrailerForm from './quotetabs/forms/RvTrailerForm';
import SemiTruckForm from './quotetabs/forms/SemiTruckForm';
import BoatForm from './quotetabs/forms/BoatForm';
import { Session } from '@supabase/auth-helpers-react';
import FreightForm from './quotetabs/forms/FreightForm';

interface SelectOptionProps {
    selectedOption: string;
    setSelectedOption: (value: string) => void;
    setErrorText: (value: string) => void;
    session: Session;
    setFormData: (data: any) => void;
}

const SelectOption: React.FC<SelectOptionProps> = ({
    selectedOption,
    setSelectedOption,
    setErrorText,
    session,
    setFormData,
}) => {
    return (
        <>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Select a Freight Type
                <select
                    className="rounded w-full dark:text-zinc-800 p-2 border border-zinc-900"
                    value={selectedOption}
                    onChange={(e) => {
                        setErrorText('');
                        setSelectedOption(e.target.value);
                    }}
                >
                    <option value="">select...</option>
                    <option value="equipment">Equipment/Machinery</option>
                    <option value="ltl_ftl">LTL/FTL</option>
                    <option value="containers">Containers</option>
                    <option value="rv_trailers">RV Trailers</option>
                    <option value="semi_trucks">Semi Trucks</option>
                    <option value="boats">Boats</option>
                </select>
            </label>

            {selectedOption === 'equipment' && (
                <EquipmentForm
                    setFormData={setFormData}
                    setErrorText={setErrorText}
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