"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, MapPin, Package, Calendar } from "lucide-react";
import EquipmentForm from "@/components/user/forms/EquipmentForm";
import ContainerForm from "@/components/user/forms/ContainerForm";
import RvTrailerForm from "@/components/user/forms/RvTrailerForm";
import SemiTruckForm from "@/components/user/forms/SemiTruckForm";
import FreightForm from "@/components/user/forms/FreightForm";
import AutoForm from "@/components/user/forms/AutoForm";

export default function NewQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    // Origin
    originCity: "",
    originState: "",
    originZip: "",

    // Destination
    destinationCity: "",
    destinationState: "",
    destinationZip: "",

    // Details
    freightType: "",
    pickupDate: "",
    dueDate: "",
    notes: "",
    specialInstructions: "",
    
    // Conditional form data will be merged here
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create quote");
      }

      const { quoteId } = await response.json();
      router.push(`/dashboard/quotes/${quoteId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Request a Quote</h1>
        <p className="text-slate-600 mt-1">
          Fill out the details below and we'll get back to you with pricing
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Origin */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Pickup Location
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                City *
              </label>
              <input
                type="text"
                name="originCity"
                value={formData.originCity || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                State *
              </label>
              <input
                type="text"
                name="originState"
                value={formData.originState || ""}
                onChange={handleChange}
                required
                maxLength={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ZIP Code *
              </label>
              <input
                type="text"
                name="originZip"
                value={formData.originZip || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Destination */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Delivery Location
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                City *
              </label>
              <input
                type="text"
                name="destinationCity"
                value={formData.destinationCity || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                State *
              </label>
              <input
                type="text"
                name="destinationState"
                value={formData.destinationState || ""}
                onChange={handleChange}
                required
                maxLength={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ZIP Code *
              </label>
              <input
                type="text"
                name="destinationZip"
                value={formData.destinationZip || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Freight Details */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Freight Details
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Load Category *
              </label>
              <select
                name="freightType"
                value={formData.freightType || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose load type...</option>
                <option value="Freight">General Freight</option>
                <option value="Equipment">Heavy Machinery & Equipment</option>
                <option value="Containers">Container Transport</option>
                <option value="Semi/Heavy Duty Trucks">Commercial Vehicle/Trucks</option>
                <option value="Auto">Auto Transport</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Conditional Forms Based on Freight Type */}
            {formData.freightType === "Equipment" && (
              <EquipmentForm
                setFormData={setFormData}
                setErrorText={setError}
                formData={formData}
              />
            )}

            {formData.freightType === "Freight" && (
              <FreightForm
                setFormData={setFormData}
                setErrorText={setError}
              />
            )}

            {formData.freightType === "Containers" && (
              <ContainerForm
                setFormData={setFormData}
                setErrorText={setError}
              />
            )}

            {formData.freightType === "Semi/Heavy Duty Trucks" && (
              <SemiTruckForm
                setFormData={setFormData}
                setErrorText={setError}
              />
            )}

            {formData.freightType === "Auto" && (
              <AutoForm
                setFormData={setFormData}
                setErrorText={setError}
                formData={formData}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Preferred Pickup Date
                </label>
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Delivery Deadline
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Additional Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes || ""}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional details about your shipment..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Special Instructions
              </label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions || ""}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any special handling requirements..."
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Quote Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
