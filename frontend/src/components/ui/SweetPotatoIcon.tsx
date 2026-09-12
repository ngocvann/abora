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
  const numericSize = typeof size === 'number' ? Math.round(size * 1.25) : (typeof size === 'string' && !isNaN(Number(size)) ? Math.round(Number(size) * 1.25) : size);
  
  return (
    <img 
      key={isFilled ? 'filled' : 'outline'}
      src={isFilled ? "/khoai-filled.png" : "/khoai-outline.png"} 
      width={numericSize} 
      height={numericSize} 
      className={`sweet-potato-icon ${isFilled ? 'filled' : 'outline'} ${className}`}
      style={{
        objectFit: 'contain',
        ...style
      }}
      alt="Củ Khoai"
      {...props}
    />
  );
};
