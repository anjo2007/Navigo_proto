
import React from 'react';

const SatelliteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z"/>
    <path d="M12 2v20"/>
    <path d="M2 12h20"/>
    <path d="M19.07 4.93 4.93 19.07"/>
    <path d="M19.07 19.07 4.93 4.93"/>
  </svg>
);

export default SatelliteIcon;
