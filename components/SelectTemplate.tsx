import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/initSupabase';
import { Template } from '@/pages/components/TemplateManager';
import { generateAndUploadPDF, replaceShortcodes } from '@/components/GeneratePDF';
import { useRouter } from 'next/router';

interface SelectTemplateProps {
    quoteId: number;
}

const SelectTemplate: React.FC<SelectTemplateProps> = ({ quoteId }) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        fetchTemplates();
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

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTemplate(e.target.value);
    };

    const handleSendTemplate = async () => {
        const selectedTemplateData = templates.find(template => template.id === selectedTemplate);
        if (!selectedTemplateData) {
            console.error('Template not found');
            return;
        }

        const { data: quote, error: quoteError } = await supabase
            .from('shippingquotes')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (quoteError) {
            console.error('Quote not found');
            return;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('company_id', quote.company_id)
            .single();

        if (profileError) {
            console.error('Profile not found');
            return;
        }

        try {
            await generateAndUploadPDF(quote, selectedTemplateData.content, selectedTemplateData.title);

            const emailContent = replaceShortcodes(selectedTemplateData.content, { quote, profile });
            const emailSubject = replaceShortcodes(selectedTemplateData.title, { quote, profile });
            const emailData = {
                to: profile.email,
                subject: emailSubject,
                text: emailContent.replace(/<[^>]+>/g, ''), // Strip HTML tags for plain text version
                html: emailContent, // Include HTML content
                attachments: [],
            };

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
            console.error('Error generating and uploading PDF or sending email:', error);
        }
    };

    return (
        <div className="flex items-center">
            <select
                value={selectedTemplate}
                onChange={handleTemplateChange}
                className="border border-gray-300 rounded-md p-1"
            >
                <option value="">Select Template</option>
                {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                        {template.title}
                    </option>
                ))}
            </select>
            {selectedTemplate && (
                <button
                    onClick={handleSendTemplate}
                    className="ml-2 text-ntsLightBlue font-medium underline"
                >
                    Send
                </button>
            )}
        </div>
    );
};

export default SelectTemplate;