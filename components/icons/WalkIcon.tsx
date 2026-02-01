
import React from 'react';

const WalkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
        <path d="M16 18V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v6"/>
        <path d="M12 8l-2.5 2.5"/>
        <path d="M14.5 10.5L12 13"/>
        <circle cx="12" cy="4" r="2"/>
    </svg>
);

export default WalkIcon;
