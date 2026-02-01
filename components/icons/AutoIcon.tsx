
import React from 'react';

const AutoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 17h2v-5h-4v-1a3 3 0 00-3-3H5a2 2 0 00-2 2v9h3.3a2 2 0 002.7 0H18a2 2 0 002.7 0H22"/>
    <circle cx="7" cy="19" r="2"/>
    <circle cx="17" cy="19" r="2"/>
    <path d="M12 17H5"/>
    <path d="M12 8H5"/>
    <path d="M3 12h9"/>
    <path d="m5 8 3-3 4 3"/>
  </svg>
);

export default AutoIcon;
