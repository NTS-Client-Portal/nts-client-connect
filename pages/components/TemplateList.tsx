import React from 'react';
import { Template } from './TemplateManager';

interface TemplateListProps {
    templates: Template[];
    context: string;
    handleEditTemplate: (template: Template) => void;
    handleDeleteTemplate: (id: string) => void;
    handleViewTemplate: (template: Template) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ templates, context, handleEditTemplate, handleDeleteTemplate, handleViewTemplate }) => {
    const filteredTemplates = templates.filter(template => template.context.toLowerCase() === context.toLowerCase());

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">{context} Templates</h2>
            <ul className="mt-4">
                {filteredTemplates.map((template) => (
                    <li key={template.id} className="mb-2">
                        <div className="flex flex-col justify-between items-center">
                            <span className='font-semibold'>{template.title}</span>
                            <div>
                                <button
                                    onClick={() => handleEditTemplate(template)}
                                    className="text-blue-500 hover:underline mr-2"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="text-red-500 hover:underline mr-2"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => handleViewTemplate(template)}
                                    className="text-green-500 hover:underline"
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TemplateList;