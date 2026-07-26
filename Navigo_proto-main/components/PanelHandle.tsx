import React from 'react';

const PanelHandle: React.FC = () => {
    return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-8 flex justify-center items-center">
            <div className="w-10 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
        </div>
    );
};

export default PanelHandle;
