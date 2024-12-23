import React, { useState } from 'react';
import { addVendor } from '@/lib/database';
import { Vendor } from '@/lib/schema';

interface VendorFormProps {
  onVendorAdded: () => void;
}

const VendorForm: React.FC<VendorFormProps> = ({ onVendorAdded }) => {
  const [vendorNumber, setVendorNumber] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [businessStreet, setBusinessStreet] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [businessState, setBusinessState] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  interface VendorFormState {
    vendorNumber: string;
    vendorName: string;
    businessStreet: string;
    businessCity: string;
    businessState: string;
    email: string;
    phone: string;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const vendor: Omit<Vendor, 'id'> = {
      vendornumber: vendorNumber,
      vendorname: vendorName,
      businessstreet: businessStreet,
      businesscity: businessCity,
      businessstate: businessState,
      email,
      phone
    };

    const { data, error } = await addVendor(vendor);

    if (error) {
      console.error('Error inserting vendor:', error);
    } else {
      console.log('Vendor inserted:', data);
      onVendorAdded();
    }
  };

  return (
    <>
      <h2 className="text-xl underline text-start mb-6">Add Vendor</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Form fields */}
        <div className="flex gap-4 justify-around w-full">
          <div className="w-full">
            <label className="block text-sm font-medium">Vendor Number</label>
            <input
              type="text"
              value={vendorNumber}
              onChange={(e) => setVendorNumber(e.target.value)}
              placeholder="Vendor Number"
              className="mt-1 pl-2 block w-full text-zinc-950 placeholder:text-zinc-500 border border-zinc-400 rounded-md shadow-sm focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium">Vendor Name</label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Vendor Name"
              className="mt-1 pl-2 block w-full text-zinc-950 placeholder:text-zinc-500 border border-zinc-400 rounded-md shadow-sm focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            />
          </div>
        </div>
        {/* Other form fields */}
        <div className="flex flex-col items-start w-full">
          <label className="block text-start text-sm font-medium w-4/5">Business Street</label>
          <input
            type="text"
            value={businessStreet}
            onChange={(e) => setBusinessStreet(e.target.value)}
            placeholder="123 Lexington St"
            className="mt-1 pl-2 block w-4/5 border border-zinc-400 rounded-md shadow-sm text-zinc-950 placeholder:text-zinc-500 focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
          />
        </div>
        <div className="flex gap-4 justify-around w-full">
          <div className="w-full">
            <label className="block text-sm font-medium">Business City</label>
            <input
              type="text"
              value={businessCity}
              onChange={(e) => setBusinessCity(e.target.value)}
              placeholder="City"
              className="mt-1 pl-2 block w-full border border-zinc-400 rounded-md shadow-sm text-zinc-950 placeholder:text-zinc-500 focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium">Business State</label>
            <input
              type="text"
              value={businessState}
              onChange={(e) => setBusinessState(e.target.value)}
              placeholder="State"
              className="mt-1 pl-2 block w-full border border-zinc-400 rounded-md shadow-sm text-zinc-950 placeholder:text-zinc-500 focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            placeholder='you@email.com'
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 pl-2 block w-full border border-zinc-400 rounded-md shadow-sm text-zinc-950 placeholder:text-zinc-500 focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            type="tel"
            value={phone}
            placeholder='(888) 888-8888'
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 pl-2 block w-full border border-zinc-400 rounded-md shadow-sm text-zinc-950 placeholder:text-zinc-500 focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="px-4 py-2 shadow-md text-stone-100 font-medium bg-zinc-900 hover:text-amber-300 hover:border-amber-300 dark:text-amber-300 border dark:border-amber-300 dark:hover:bg-amber-300 dark:hover:text-zinc-900">
            Submit
          </button>
        </div>
      </form>
    </>
  );
};

export default VendorForm;