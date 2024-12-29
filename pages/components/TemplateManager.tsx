import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import TemplateList from './TemplateList';
import Modal from './Modal';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { generateAndUploadPDF, replaceShortcodes } from '@/components/GeneratePDF';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export interface Template {
    id: string;
    title: string;
    content: string;
    type: string;
    context: string; // Add context field
}

const TemplateManager: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [shippingQuotes, setShippingQuotes] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [ntsUsers, setNtsUsers] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [context, setContext] = useState('quote'); // Add state for context
    const [isHtmlView, setIsHtmlView] = useState(false); // Add state for HTML view toggle
    const [isModalOpen, setIsModalOpen] = useState(false); // Add state for modal

    useEffect(() => {
        fetchTemplates();
        fetchProfiles();
        fetchShippingQuotes();
        fetchCompanies();
        fetchNtsUsers();
    }, []);

    const fetchTemplates = async () => {
        const { data, error } = await supabase
            .from('templates')
            .select('*');

        if (error) {
            console.error('Error fetching templates:', error.message);
        } else {
            setTemplates(data);
        }
    };

    const fetchProfiles = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');

        if (error) {
            console.error('Error fetching profiles:', error.message);
        } else {
            setProfiles(data);
        }
    };

    const fetchShippingQuotes = async () => {
        const { data, error } = await supabase
            .from('shippingquotes')
            .select('*');

        if (error) {
            console.error('Error fetching shipping quotes:', error.message);
        } else {
            setShippingQuotes(data);
        }
    };

    const fetchCompanies = async () => {
        const { data, error } = await supabase
            .from('companies')
            .select('*');

        if (error) {
            console.error('Error fetching companies:', error.message);
        } else {
            setCompanies(data);
        }
    };

    const fetchNtsUsers = async () => {
        const { data, error } = await supabase
            .from('nts_users')
            .select('*');

        if (error) {
            console.error('Error fetching nts users:', error.message);
        } else {
            setNtsUsers(data);
        }
    };

    const handleEditTemplate = (template: Template) => {
        setSelectedTemplate(template);
        setTitle(template.title);
        setContent(template.content);
        setContext(template.context); // Set context state
    };

    const handleDeleteTemplate = async (id: string) => {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting template:', error.message);
        } else {
            setTemplates(templates.filter((template) => template.id !== id));
        }
    };

    const handleSaveTemplate = async () => {
        const pdfTemplate = { title, content, type: 'pdf', context };
        const emailTemplate = { title, content, type: 'email', context };

        if (selectedTemplate) {
            const { error: pdfError } = await supabase
                .from('templates')
                .update(pdfTemplate)
                .eq('id', selectedTemplate.id);

            const { error: emailError } = await supabase
                .from('templates')
                .update(emailTemplate)
                .eq('id', selectedTemplate.id);

            if (pdfError || emailError) {
                console.error('Error updating template:', pdfError?.message || emailError?.message);
            } else {
                fetchTemplates();
                setSelectedTemplate(null);
                setTitle('');
                setContent('');
                setContext('quote'); // Reset context state
            }
        } else {
            const { error: pdfError } = await supabase
                .from('templates')
                .insert(pdfTemplate);

            const { error: emailError } = await supabase
                .from('templates')
                .insert(emailTemplate);

            if (pdfError || emailError) {
                console.error('Error creating template:', pdfError?.message || emailError?.message);
            } else {
                fetchTemplates();
                setTitle('');
                setContent('');
                setContext('quote'); // Reset context state
            }
        }
    };

    const handleViewTemplate = (template: Template) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
    };

    const handleSendEmail = async () => {
        if (!selectedTemplate) return;

        const emailContent = replaceShortcodes(selectedTemplate.content, { /* Add necessary data here */ });
        const emailSubject = replaceShortcodes(selectedTemplate.title, { /* Add necessary data here */ });
        const emailData = {
            to: 'recipient@example.com', // Replace with actual recipient
            subject: emailSubject,
            text: emailContent.replace(/<[^>]+>/g, ''), // Strip HTML tags for plain text version
            html: emailContent, // Include HTML content
            attachments: [],
        };

        try {
            const response = await fetch('/api/sendEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData),
            });

            if (response.ok) {
                alert('Email sent successfully');
            } else {
                alert('Error sending email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
        }
    };

    return (
        <div className='h-full w-full bg-ntsBlue/10 p-8'>
            <h1 className="text-2xl font-bold mb-4">Template Manager</h1>
            <div className='flex gap-12'>
                <div className='w-1/2'>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Context</label>
                        <select
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-zinc-900/30 shadow-md bg-white focus:border-ntsLightBlue focus:ring focus:ring-ntsLightBlue focus:ring-opacity-50"
                        >
                            <option value="quote">Quote Update</option>
                            <option value="order">Order Completion</option>
                            <option value="shipment">Dispatch Notification</option>
                            <option value="bol">BOL</option>
                            <option value="invoice">Invoice Sent</option>
                            <option value="payment">Payment Received</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-zinc-900/30 shadow-md focus:border-ntsLightBlue focus:ring focus:ring-ntsLightBlue focus:ring-opacity-50"
                        />
                    </div>
                    <div className="border-none h-96 bg-white px-4 shadow-md rounded-md">
                        <label className="block text-sm font-medium text-gray-700">Content</label>

                        <button
                            onClick={() => setIsHtmlView(!isHtmlView)}
                            className="py-1 px-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ntsLightBlue hover:bg-ntsLightBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ntsLightBlue"
                        >
                            {isHtmlView ? 'Switch to Editor' : 'Switch to HTML'}
                        </button>

                        {isHtmlView ? (
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="mt-1 block w-full h-64 bg-white border border-zinc-600 focus:border-ntsLightBlue focus:ring focus:ring-ntsLightBlue focus:ring-opacity-50"
                            />
                        ) : (
                            <ReactQuill
                                value={content}
                                onChange={setContent}
                                className="mt-1 w-full h-64 bg-white focus:border-ntsLightBlue focus:ring focus:ring-ntsLightBlue focus:ring-opacity-50"
                            />
                        )}

                    </div>
                    <button
                        onClick={handleSaveTemplate}
                        className="py-2 px-4 mt-4 rounded-md text-sm font-medium text-white bg-ntsLightBlue hover:bg-ntsLightBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ntsLightBlue"
                    >
                        {selectedTemplate ? 'Update Template' : 'Create Template'}
                    </button>
                    {selectedTemplate?.type === 'email' && (
                        <button
                            onClick={handleSendEmail}
                            className="py-2 px-4 mt-4 rounded-md text-sm font-medium text-white bg-ntsLightBlue hover:bg-ntsLightBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ntsLightBlue"
                        >
                            Send Email
                        </button>
                    )}
                </div>
                <div className="mt-8 border border-zinc-900/30 p-4 bg-white shadow-md rounded-md w-fit">
                    <h2 className="text-xl font-bold mb-4">Shortcodes Legend</h2>
                    <ul className="list-disc list-inside">
                        <li><strong>Quote ID</strong> - <code>{'{quote.id}'}</code></li>
                        <li><strong>Origin City</strong> - <code>{'{quote.origin_city}'}</code></li>
                        <li><strong>Origin State</strong> - <code>{'{quote.origin_state}'}</code></li>
                        <li><strong>Destination City</strong> - <code>{'{quote.destination_city}'}</code></li>
                        <li><strong>Destination State</strong> - <code>{'{quote.destination_state}'}</code></li>
                        <li><strong>Quote Price</strong> - <code>{'{quote.price}'}</code></li>
                        <li><strong>Due Date</strong> - <code>{'{quote.due_date}'}</code></li>
                        <li><strong>Freight Year</strong> - <code>{'{quote.year}'}</code></li>
                        <li><strong>Freight Make</strong> - <code>{'{quote.make}'}</code></li>
                        <li><strong>Freight Model</strong> - <code>{'{quote.model}'}</code></li>
                        <li><strong>User ID</strong> - <code>{'{quote.user_id}'}</code></li>
                        <li><strong>User Email</strong> - <code>{'{profile.email}'}</code></li>
                        <li><strong>User First Name</strong> - <code>{'{profile.first_name}'}</code></li>
                        <li><strong>User Last Name</strong> - <code>{'{profile.last_name}'}</code></li>
                        <li><strong>Company Name</strong> - <code>{'{company.company_name}'}</code></li>
                        <li><strong>Company Industry</strong> - <code>{'{company.industry}'}</code></li>
                        <li><strong>NTS User Email</strong> - <code>{'{nts_users.email}'}</code></li>
                        <li><strong>NTS User Phone Number</strong> - <code>{'{nts_users.phone_number}'}</code></li>
                        <li><strong>NTS User First Name</strong> - <code>{'{nts_users.first_name}'}</code></li>
                        <li><strong>NTS User Last Name</strong> - <code>{'{nts_users.last_name}'}</code></li>
                    </ul>
                </div>
            </div>

            <div className='grid grid-cols-3 gap-8 mt-8 justify-items-center'>
                <TemplateList
                    templates={templates}
                    context="quote"
                    handleEditTemplate={handleEditTemplate}
                    handleDeleteTemplate={handleDeleteTemplate}
                    handleViewTemplate={handleViewTemplate}
                />
                <TemplateList
                    templates={templates}
                    context="order"
                    handleEditTemplate={handleEditTemplate}
                    handleDeleteTemplate={handleDeleteTemplate}
                    handleViewTemplate={handleViewTemplate}
                />
                <TemplateList
                    templates={templates}
                    context="shipment"
                    handleEditTemplate={handleEditTemplate}
                    handleDeleteTemplate={handleDeleteTemplate}
                    handleViewTemplate={handleViewTemplate}
                />
                <TemplateList
                    templates={templates}
                    context="bol"
                    handleEditTemplate={handleEditTemplate}
                    handleDeleteTemplate={handleDeleteTemplate}
                    handleViewTemplate={handleViewTemplate}
                />
                <TemplateList
                    templates={templates}
                    context="invoice"
                    handleEditTemplate={handleEditTemplate}
                    handleDeleteTemplate={handleDeleteTemplate}
                    handleViewTemplate={handleViewTemplate}
                />
                <TemplateList
                    templates={templates}
                    context="payment"
                    handleEditTemplate={handleEditTemplate}
                    handleDeleteTemplate={handleDeleteTemplate}
                    handleViewTemplate={handleViewTemplate}
                />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedTemplate?.title}>
                <div dangerouslySetInnerHTML={{ __html: selectedTemplate?.content || '' }} />
            </Modal>
        </div>
    );
};

export default TemplateManager;