import React from 'react';

const NewLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <linearGradient id="auroraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#EC4899' }} />
        <stop offset="100%" style={{ stopColor: '#8B5CF6' }} />
      </linearGradient>
    </defs>
    <path 
      d="M12 2L4 6v12l8 4 8-4V6l-8-4zm0 2.53L17.5 7.6v8.8L12 19.47V4.53zM6.5 8.15l5.5-2.62v13.04l-5.5-2.75V8.15z" 
      fill="url(#auroraGradient)" 
    />
  </svg>
);

export default NewLogo;
