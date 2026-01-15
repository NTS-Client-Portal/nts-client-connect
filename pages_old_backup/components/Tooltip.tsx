import React from 'react';

const Tooltip = ({ children, label }) => (
    <div className="group relative flex items-center justify-center">
        {children}
        <span className="pointer-events-none absolute left-full ml-2 z-50 hidden whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:block transition-opacity duration-200">
            {label}
        </span>
    </div>
);

export default Tooltip;