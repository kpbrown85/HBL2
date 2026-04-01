import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = true, light = false }) => {
  const color = light ? "#F5F2ED" : "#C5943E";
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Circle */}
        <circle cx="100" cy="85" r="75" stroke={color} strokeWidth="8" />
        
        {/* Stylized Llama Head */}
        <path 
          d="M75 60 C 75 40, 85 30, 90 45 L 95 70 L 105 70 L 110 45 C 115 30, 125 40, 125 60 C 125 90, 115 110, 100 115 C 85 110, 75 90, 75 60 Z" 
          fill={color} 
        />
        <path 
          d="M90 100 C 90 95, 110 95, 110 100 C 110 105, 105 108, 100 108 C 95 108, 90 105, 90 100 Z" 
          fill="#0B1D21" 
        />
        {/* Ears */}
        <path d="M80 50 L 70 20 L 85 45 Z" fill={color} />
        <path d="M120 50 L 130 20 L 115 45 Z" fill={color} />
      </svg>
      
      {showText && (
        <div className={`mt-2 flex flex-col items-center leading-none tracking-[0.3em] font-black uppercase ${light ? 'text-paper' : 'text-gold'}`}>
          <span className="text-[0.6em]">Helena</span>
          <span className="text-[0.5em] mt-1">Backcountry</span>
          <span className="text-[0.6em] mt-1">Llamas</span>
        </div>
      )}
    </div>
  );
};
