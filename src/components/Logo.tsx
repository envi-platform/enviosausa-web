import React from 'react';
import { useTheme } from '../context/ThemeContext.tsx';

interface LogoProps {
  variant?: 'navbar' | 'full' | 'symbol';
  className?: string;
  imgSrc?: string; // Permitir inyectar un logo subido por el usuario
}

const Logo: React.FC<LogoProps> = ({ variant = 'full', className = '', imgSrc = '/logo.png' }) => {
  const { mode } = useTheme();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-shrink-0 flex items-center">
        <picture>
           <source srcSet={imgSrc} type="image/png" />
           <div className="relative">
             <img 
               src={imgSrc} 
               alt="ENVI Logo" 
               className={`object-contain ${variant === 'symbol' ? 'h-10 w-10' : 'h-10'}`}
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
                 const fallbackText = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                 if (fallbackText) fallbackText.style.display = 'block';
               }}
             />
             <div className="hidden text-3xl font-black italic tracking-tighter" style={{fontFamily: 'Impact, sans-serif'}}>
                <span className="text-envi-azul dark:text-white">EN</span><span className="text-envi-celeste">VI</span>
             </div>
           </div>
        </picture>
      </div>
      {(variant === 'full' || variant === 'navbar') && (
        <div className="flex flex-col justify-center">
           <span className={`font-montserrat font-black text-2xl leading-none tracking-tighter italic ${variant === 'navbar' ? 'text-white' : 'text-envi-azul dark:text-white'}`}>
             ENVI
           </span>
           <span className={`font-montserrat text-[7px] font-bold uppercase tracking-[0.2em] leading-none mt-1 ${variant === 'navbar' ? 'text-envi-celeste' : 'text-gray-500 dark:text-slate-400'}`}>
             {variant === 'navbar' ? 'SISTEMA LOGÍSTICO' : 'ENVÍOS INTERNACIONALES'}
           </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
