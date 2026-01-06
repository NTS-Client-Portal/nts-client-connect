import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@/lib/supabase/provider';
import { Session } from '@supabase/supabase-js';
import { Database } from '@lib/database.types';
import { v4 as uuidv4 } from 'uuid';

interface LanesInventoryProps {
    session: Session | null;
}
type profiles = Database['public']['Tables']['profiles']['Row'];
type Lane = Database['public']['Tables']['lanes_inventory']['Row'];

const LanesInventory = ({ session }: LanesInventoryProps) => {
    const supabase = useSupabaseClient<Database>();
    const [lanesList, setLanesList] = useState<Lane[]>([]);
    const [selectedLane, setSelectedLane] = useState<Lane | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [errorText, setErrorText] = useState<string>('');
    const [originAddress, setOriginAddress] = useState<string>('');
    const [originCity, setOriginCity] = useState<string>('');
    const [originState, setOriginState] = useState<string>('');
    const [originZip, setOriginZip] = useState<string>('');
    const [destinationAddress, setDestinationAddress] = useState<string>('');
    const [destinationCity, setDestinationCity] = useState<string>('');
    const [destinationState, setDestinationState] = useState<string>('');
    const [destinationZip, setDestinationZip] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [companyId, setCompanyId] = useState<string>('');

    const user = session?.user;

    const fetchCompanyId = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            if (error) {
                throw new Error(error.message);
            }

            setCompanyId(data.company_id);
        } catch (error) {
            console.error('Error fetching company ID:', error);
            setErrorText('Error fetching company ID');
        }
    }, [user, supabase]);

    const fetchLanes = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('lanes_inventory')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                throw new Error(error.message);
            }

            setLanesList(data || []);
        } catch (error) {
            console.error('Error fetching lanes data:', error);
            setErrorText('Error fetching lanes data');
        }
    }, [user, supabase]);

    useEffect(() => {
        if (user) {
            fetchCompanyId();
            fetchLanes();
        }
    }, [user, fetchCompanyId, fetchLanes]);

    const addOrUpdateLane = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !companyId) return;

        const laneData = {
            user_id: user.id,
            company_id: companyId,
            origin_address: originAddress,
            origin_city: originCity,
            origin_state: originState,
            origin_zip: originZip,
            destination_address: destinationAddress,
            destination_city: destinationCity,
            destination_state: destinationState,
            destination_zip: destinationZip,
            notes: notes,
            id: selectedLane ? selectedLane.id : uuidv4(), // Generate a unique ID if not editing
        };

        let response: { data: Lane[] | null; error: { message: string } | null };
        if (selectedLane) {
            response = await supabase
                .from('lanes_inventory')
                .update(laneData)
                .eq('id', selectedLane.id)
                .select();
        } else {
            response = await supabase
                .from('lanes_inventory')
                .insert([laneData])
                .select();
        }

        const { data, error } = response;

        if (error) {
            console.error('Error adding/updating lane:', error.message);
            setErrorText('Error adding/updating lane');
        } else {
            setLanesList([...lanesList.filter(l => l.id !== selectedLane?.id), ...(data || [])]);
            resetForm();
            setIsModalOpen(false);
        }
    };

    const deleteLane = async (id: string) => {
        if (!user) return;

        const { error } = await supabase
            .from('lanes_inventory')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting lane:', error.message);
            setErrorText('Error deleting lane');
        } else {
            fetchLanes();
        }
    };

    const handleDeleteClick = (id: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this lane?');
        if (confirmed) {
            deleteLane(id);
        }
    };

    const editLane = (lane: Lane) => {
        setSelectedLane(lane);
        setOriginAddress(lane.origin_address);
        setOriginCity(lane.origin_city);
        setOriginState(lane.origin_state);
        setOriginZip(lane.origin_zip);
        setDestinationAddress(lane.destination_address);
        setDestinationCity(lane.destination_city);
        setDestinationState(lane.destination_state);
        setDestinationZip(lane.destination_zip);
        setNotes(lane.notes);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setSelectedLane(null);
        setOriginAddress('');
        setOriginCity('');
        setOriginState('');
        setOriginZip('');
        setDestinationAddress('');
        setDestinationCity('');
        setDestinationState('');
        setDestinationZip('');
        setNotes('');
        setErrorText('');
    };

    return (
        <div className="w-full grid grid-rows md:gap-6 md:pt-6 dark:bg-zinc-600">
            <div className="w-full">
                <div className='flex flex-col justify-center items-center'>
                    <h1 className="xs:text-md mb-2 text-xl md:text-2xl font-medium text-center underline underline-offset-8">Lanes Inventory</h1>
                </div>
                {isModalOpen && (
                    <div className="fixed inset-0 dark:text-zinc-100 z-50 h-full bg-opacity-50 flex justify-center items-center">
                        <div className="dark:text-zinc-100 dark:bg-zinc-900 border border-zinc-700 shadow-lg bg-zinc-100 z-50 p-4 md:p-8 h-[770px] max-h-max my-16 rounded w-full md:w-1/2 overflow-y-auto">
                            <h2 className="text-xl dark:text-zinc-100 mb-4">{selectedLane ? 'Edit Lane' : 'Add Lane'}</h2>
                            <form onSubmit={addOrUpdateLane} className="flex flex-col w-full gap-2 my-2 p-2 bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100">
                                <div className='flex flex-col gap-4 w-full dark:bg-zinc-900 dark:text-zinc-100'>
                                    <label className='text-zinc-900 font-medium dark:text-zinc-100'>Origin Address
                                        <input
                                            className="rounded w-full p-2 border text-zinc-900 border-zinc-900"
                                            type="text"
                                            placeholder='Origin Address'
                                            value={originAddress}
                                            onChange={(e) => {
                                                setErrorText('');
                                                setOriginAddress(e.target.value);
                                            }}
                                        />
                                    </label>
                                    <label className='text-zinc-900 font-medium dark:text-zinc-100'>Origin City
                                        <input
                                            className="rounded w-full p-2 border text-zinc-900 border-zinc-900"
                                            type="text"
                                            placeholder='Origin City'
                                            value={originCity}
                                            onChange={(e) => {
                                                setErrorText('');
                                                setOriginCity(e.target.value);
                                            }}
                                        />
                                    </label>
                                    <label className='text-zinc-900 font-medium dark:text-zinc-100'>Origin State
                                        <input
                                            className="rounded w-full p-2 border text-zinc-900 border-zinc-900"
                                            type="text"
                                            placeholder='Origin State'
                                            value={originState}
                                            onChange={(e) => {
                                                setErrorText('');
                                                setOriginState(e.target.value);
                                            }}
                                        />
                                    </label>
                                    <label className='text-zinc-900 font-medium dark:text-zinc-100'>Origin Zip
                                        <input
                                            className="rounded w-full p-2 border text-zinc-900 border-zinc-900"
                                            type="text"
                                            placeholder='Origin Zip'
                                            value={originZip}
                                            onChange={(e) => {
                                                setErrorText('');
                                                setOriginZip(e.target.value);
                                            }}
                                        />
                                    </label>
                                    <label className='text-zinc-900 font-medium dark:text-zinc-100'>Destination Address
                                        <input
                                            className="rounded w-full p-2 border text-zinc-900 border-zinc-900"
                                            type="text"
                                            placeholder='Destination Address'
                                            value={destinationAddress}
                                            onChange={(e) => {
                                                setErrorText('');
                                                setDestinationAddress(e.target.value);
                                            }}
                                        />
                                    </label>
                                    <label className='text-zinc-900 font-medium dark:text-zinc-100'>Destination City
                                        <input
                                            className="rounded w-full p-2 border text-zinc-900 border-zinc-900"
                                            type="text"
                                            placeholder='Destination City'
                                            value={destinationCity}
                                            onChange={(e) => {
                                                setErrorText('');
                                                setDestinationCity(e.target.value);
                                            }}
                                        />
                                    </label>
                                    <label className='text-zinc-900 font-medium dark:text-zinc-100'>Destination State
                                        <input
                                            className="rounded w-full p-2 border text-zinc-900 border-zinc-900"
                                            type="text"
                                            placeholder='Destination State'
                                            value={destinationState}
                                            onChange={(e) => {
                                                setErrorText('');
                                                setDestinationState(e.target.value);
                                            }}
                                        />
                                    </label>
                                    <label className='text-zinc-900 font-medium dark:text-zinc-100'>Destination Zip
                                        <input
                                            className="rounded w-full p-2 border text-zinc-900 border-zinc-900"
                                            type="text"
                                            placeholder='Destination Zip'
                                            value={destinationZip}
                                            onChange={(e) => {
                                                setErrorText('');
                                                setDestinationZip(e.target.value);
                                            }}
                                        />
                                    </label>
                                    <label className='text-zinc-900 font-medium dark:text-zinc-100'>Notes
                                        <textarea
                                            className="rounded w-full p-2 border text-zinc-900 border-zinc-900"
                                            placeholder='Notes'
                                            value={notes}
                                            onChange={(e) => {
                                                setErrorText('');
                                                setNotes(e.target.value);
                                            }}
                                        />
                                    </label>
                                </div>
                                <button className="body-btn" type="submit">
                                    {selectedLane ? 'Update Lane' : 'Add Lane'}
                                </button>
                                {selectedLane && (
                                    <button type="button" className="btn-slate mt-2 shadow-md hover:bg-stone-300/50 hover:text-zinc-700" onClick={resetForm}>
                                        Close
                                    </button>
                                )}
                                <button type="button" className="bg-stone-300 text-zinc-800 py-2 px-4 font-semibold mt-2 hover:bg-stone-300/50 hover:text-zinc-700" onClick={() => setIsModalOpen(false)}>
                                    Close
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                {!!errorText && <div className="text-red-500">{errorText}</div>}
            </div>

            <div className='flex flex-col gap-2 justify-center items-center w-full'>
                <div className='flex md:flex-row flex-col-reverse gap-2 justify-between items-center w-full'>
                    <div className="mt-4 md:m-0">
                        <button className="body-btn" onClick={() => setIsModalOpen(true)}>
                            Add Lane
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-ntsLightBlue text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Origin </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Destination</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Notes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {lanesList.map((lane) => (
                                <tr key={lane.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {lane.origin_address} {lane.origin_city}, {lane.origin_state} {lane.origin_zip}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {lane.destination_address} {lane.destination_city}, {lane.destination_state} {lane.destination_zip}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lane.notes}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button className="text-ntsLightBlue hover:text-ntsLightBlue/90" onClick={() => editLane(lane)}>Edit</button>
                                        <button className="text-red-600 hover:text-red-900 ml-4" onClick={() => handleDeleteClick(lane.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LanesInventory;