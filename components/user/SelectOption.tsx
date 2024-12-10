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
    addQuote: (quote: any) => void;
    closeModal: () => void;
}

const SelectOption: React.FC<SelectOptionProps> = ({
    selectedOption,
    setSelectedOption,
    setErrorText,
    session,
    addQuote,
    closeModal,
}) => {
    return (
        <>
            <label className='text-zinc-900 dark:text-zinc-100 font-medium'>Select Option
                <select
                    className="rounded w-full dark:text-zinc-800 p-2 border border-zinc-900"
                    value={selectedOption}
                    onChange={(e) => {
                        setErrorText('');
                        setSelectedOption(e.target.value);
                    }}
                >
                    <option value="">Select...</option>
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
                    session={session}
                    addQuote={addQuote}
                    setErrorText={setErrorText}
                    closeModal={closeModal}
                />
            )}

            {selectedOption === 'ltl_ftl' && (
                <FreightForm
                    session={session}
                    addQuote={addQuote}
                    setErrorText={setErrorText}
                    closeModal={closeModal}
                />
            )}

            {selectedOption === 'containers' && (
                <ContainerForm
                    session={session}
                    addQuote={addQuote}
                    setErrorText={setErrorText}
                    closeModal={closeModal}
                />
            )}

            {selectedOption === 'rv_trailers' && (
                <RvTrailerForm
                    session={session}
                    addQuote={addQuote}
                    setErrorText={setErrorText}
                    closeModal={closeModal}
                />
            )}

            {selectedOption === 'semi_trucks' && (
                <SemiTruckForm
                    session={session}
                    addQuote={addQuote}
                    setErrorText={setErrorText}
                    closeModal={closeModal}
                />
            )}

            {selectedOption === 'boats' && (
                <BoatForm
                    session={session}
                    addQuote={addQuote}
                    setErrorText={setErrorText}
                    closeModal={closeModal}
                />
            )}
        </>
    );
};

export default SelectOption;