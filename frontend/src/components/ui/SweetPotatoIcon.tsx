import React from 'react';

interface IconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number | string;
  fill?: string;
}

export const SweetPotatoIcon: React.FC<IconProps> = ({ 
  size = 24, 
  className = "", 
  fill = "none",
  style,
  ...props 
}) => {
  const isFilled = fill !== "none" && fill !== "transparent";
  
  return (
    <img 
      key={isFilled ? 'filled' : 'outline'}
      src={isFilled ? "/khoai-filled.png" : "/khoai-outline.png"} 
      width={size} 
      height={size} 
      className={`sweet-potato-icon ${isFilled ? 'filled' : 'outline'} ${className}`}
      style={{
        objectFit: 'contain',
        filter: isFilled 
          ? 'drop-shadow(0px 0px 2px rgba(255,255,255,0.8))' 
          : 'brightness(0) invert(1) opacity(0.8)',
        ...style
      }}
      alt="Khoai"
      {...props}
    />
  );
};
