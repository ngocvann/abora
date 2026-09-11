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
        ...style
      }}
      alt="Khoai"
      {...props}
    />
  );
};
