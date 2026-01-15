import React, { useState, useEffect } from 'react';
import { Package, MapPin, DollarSign, Settings } from 'lucide-react';

interface ContainerFormProps {
    setFormData: (data: any) => void;
    setErrorText: (value: string) => void;
}

const ContainerForm: React.FC<ContainerFormProps> = ({
    setFormData,
    setErrorText,
}) => {
    const [containerLength, setContainerLength] = useState<number | null>(null);
    const [containerType, setContainerType] = useState<string | null>(null);
    const [contentsDescription, setContentsDescription] = useState<string | null>(null);
    const [destinationSurfaceType, setDestinationSurfaceType] = useState<string | null>(null);
    const [destinationType, setDestinationType] = useState<string | null>(null);
    const [destinationTypeDescription, setDestinationTypeDescription] = useState<string | null>(null);
    const [goodsValue, setGoodsValue] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState<boolean | null>(true);
    const [loadingAssistance, setLoadingAssistance] = useState('');
    const [originSurfaceType, setOriginSurfaceType] = useState<string | null>(null);
    const [originType, setOriginType] = useState<string | null>(null);
    const [originTypeDescription, setOriginTypeDescription] = useState<string | null>(null);

    useEffect(() => {
        const formData = {
            container_length: containerLength,
            container_type: containerType,
            contents_description: contentsDescription,
            destination_surface_type: destinationSurfaceType,
            destination_type: destinationType === 'Business' || destinationType === 'Residential',
            destination_type_description: destinationType === 'Other' ? destinationTypeDescription : null,
            goods_value: goodsValue,
            is_loaded: isLoaded,
            loading_assistance: loadingAssistance,
            origin_surface_type: originSurfaceType,
            origin_type: originType === 'Business' || originType === 'Residential',
            origin_type_description: originType === 'Other' ? originTypeDescription : null,
        };

        setFormData((prev: any) => ({ ...prev, ...formData }));
    }, [containerLength, containerType, contentsDescription, destinationSurfaceType, destinationType, loadingAssistance, destinationTypeDescription, goodsValue, isLoaded, originSurfaceType, originType, originTypeDescription, setFormData]);

    return (
        <div className="space-y-8">
            {/* Container Information */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h4 className="text-lg font-medium text-gray-900">Container Details</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="nts-form-group">
                            <label className="nts-label" htmlFor="container-length">Container Length</label>
                            <select
                                id="container-length"
                                className="nts-input"
                                value={containerLength || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setContainerLength(e.target.value ? parseInt(e.target.value) : null);
                                }}
                            >
                                <option value="">Select length...</option>
                                <option value="20">20 ft Container</option>
                                <option value="40">40 ft Container</option>
                                <option value="45">45 ft Container</option>
                                <option value="53">53 ft Container</option>
                            </select>
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label" htmlFor="container-type">Container Type</label>
                            <select
                                id="container-type"
                                className="nts-input"
                                value={containerType || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setContainerType(e.target.value || null);
                                }}
                            >
                                <option value="">Select type...</option>
                                <option value="Dry Van">Dry Van</option>
                                <option value="Refrigerated">Refrigerated (Reefer)</option>
                                <option value="Open Top">Open Top</option>
                                <option value="Flat Rack">Flat Rack</option>
                                <option value="Tank">Tank Container</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Container Contents */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Settings className="w-5 h-5 text-green-600" />
                    <h4 className="text-lg font-medium text-gray-900">Contents & Status</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="nts-form-group">
                            <label className="nts-label" htmlFor="container-status">Container Status</label>
                            <select
                                id="container-status"
                                className="nts-input"
                                value={isLoaded === null ? '' : isLoaded ? 'loaded' : 'empty'}
                                onChange={(e) => {
                                    setErrorText('');
                                    setIsLoaded(e.target.value === 'loaded');
                                }}
                            >
                                <option value="">Select status...</option>
                                <option value="loaded">Loaded</option>
                                <option value="empty">Empty</option>
                            </select>
                        </div>
                        <div className="nts-form-group">
                            <label className="nts-label" htmlFor="contents-value">Contents Value</label>
                            <input
                                id="contents-value"
                                className="nts-input"
                                type="text"
                                placeholder="$50,000"
                                value={goodsValue || ''}
                                onChange={(e) => {
                                    setErrorText('');
                                    setGoodsValue(e.target.value || null);
                                }}
                            />
                        </div>
                        {isLoaded && (
                            <div className="nts-form-group md:col-span-2">
                                <label className="nts-label" htmlFor="contents-description">Contents Description</label>
                                <input
                                    id="contents-description"
                                    className="nts-input"
                                    type="text"
                                    placeholder="e.g. electronics, furniture, machinery"
                                    value={contentsDescription || ''}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setContentsDescription(e.target.value || null);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Location Information */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <h4 className="text-lg font-medium text-gray-900">Location Requirements</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Origin Details */}
                        <div className="space-y-4">
                            <h5 className="font-medium text-gray-900">📤 Origin Location</h5>
                            <div className="nts-form-group">
                                <label className="nts-label" htmlFor="origin-type">Location Type</label>
                                <select
                                    id="origin-type"
                                    className="nts-input"
                                    value={originType || ''}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setOriginType(e.target.value || null);
                                    }}
                                >
                                    <option value="">Select...</option>
                                    <option value="Business">Business</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            {originType === 'Other' && (
                                <div className="nts-form-group">
                                    <label className="nts-label" htmlFor="origin-description">Describe Location</label>
                                    <input
                                        id="origin-description"
                                        className="nts-input"
                                        type="text"
                                        placeholder="e.g. Port, Warehouse, Construction Site"
                                        value={originTypeDescription || ''}
                                        onChange={(e) => {
                                            setErrorText('');
                                            setOriginTypeDescription(e.target.value || null);
                                        }}
                                    />
                                </div>
                            )}
                            <div className="nts-form-group">
                                <label className="nts-label" htmlFor="origin-surface">Ground Surface</label>
                                <select
                                    id="origin-surface"
                                    className="nts-input"
                                    value={originSurfaceType || ''}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setOriginSurfaceType(e.target.value || null);
                                    }}
                                >
                                    <option value="">Select surface...</option>
                                    <option value="Paved">Paved</option>
                                    <option value="Gravel">Gravel</option>
                                    <option value="Dirt">Dirt/Unpaved</option>
                                </select>
                            </div>
                        </div>

                        {/* Destination Details */}
                        <div className="space-y-4">
                            <h5 className="font-medium text-gray-900">📥 Destination Location</h5>
                            <div className="nts-form-group">
                                <label className="nts-label" htmlFor="destination-type">Location Type</label>
                                <select
                                    id="destination-type"
                                    className="nts-input"
                                    value={destinationType || ''}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setDestinationType(e.target.value || null);
                                    }}
                                >
                                    <option value="">Select...</option>
                                    <option value="Business">Business</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            {destinationType === 'Other' && (
                                <div className="nts-form-group">
                                    <label className="nts-label" htmlFor="destination-description">Describe Location</label>
                                    <input
                                        id="destination-description"
                                        className="nts-input"
                                        type="text"
                                        placeholder="e.g. Port, Warehouse, Construction Site"
                                        value={destinationTypeDescription || ''}
                                        onChange={(e) => {
                                            setErrorText('');
                                            setDestinationTypeDescription(e.target.value || null);
                                        }}
                                    />
                                </div>
                            )}
                            <div className="nts-form-group">
                                <label className="nts-label" htmlFor="destination-surface">Ground Surface</label>
                                <select
                                    id="destination-surface"
                                    className="nts-input"
                                    value={destinationSurfaceType || ''}
                                    onChange={(e) => {
                                        setErrorText('');
                                        setDestinationSurfaceType(e.target.value || null);
                                    }}
                                >
                                    <option value="">Select surface...</option>
                                    <option value="Paved">Paved</option>
                                    <option value="Gravel">Gravel</option>
                                    <option value="Dirt">Dirt/Unpaved</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Services */}
            <div className="nts-form-section">
                <div className="nts-form-section-header">
                    <Settings className="w-5 h-5 text-orange-600" />
                    <h4 className="text-lg font-medium text-gray-900">Additional Services</h4>
                </div>
                <div className="nts-form-section-body">
                    <div className="nts-form-group">
                        <label className="nts-label" htmlFor="loading-assistance">Loading Assistance Required</label>
                        <input
                            id="loading-assistance"
                            className="nts-input"
                            type="text"
                            placeholder="e.g. Crane, Forklift, Chassis"
                            value={loadingAssistance}
                            onChange={(e) => {
                                setErrorText('');
                                setLoadingAssistance(e.target.value);
                            }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Specify any special equipment needed for loading/unloading the container
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContainerForm;
