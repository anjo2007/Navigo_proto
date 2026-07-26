
import React from 'react';

const BusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <line x1="3" y1="11" x2="3" y2="7" />
    <line x1="21" y1="11" x2="21" y2="7" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
    <path d="M3 7h18" />
    <path d="M4 11V9a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
  </svg>
);

export default BusIcon;
