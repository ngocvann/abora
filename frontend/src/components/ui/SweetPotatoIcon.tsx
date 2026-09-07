import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const SweetPotatoIcon: React.FC<IconProps> = ({ 
  size = 24, 
  className = "", 
  fill = "none", 
  color = "currentColor", 
  strokeWidth = 2, 
  ...props 
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={fill} 
    stroke={color} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    <path d="M17.5 4.5c2 2 3.5 5 2.5 8s-3.5 7-6.5 8-7-1-8.5-4-1.5-6.5-.5-9.5 3-4 6-4 5 1.5 7 1.5z" />
    <path d="M7 10c.5-1 1.5-1 2.5-.5" />
    <path d="M14 15c.5-1 2-1 2.5 0" />
    <path d="M10 16c1-1 3-1 3.5 .5" />
  </svg>
);
