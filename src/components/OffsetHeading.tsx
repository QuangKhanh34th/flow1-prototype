import React from "react";

interface OffsetHeadingProps {
  text: string;
  boxColor?: string; // e.g., 'bg-mint' or 'bg-sage'
  boxWidth?: string; // Controls how far the block extends (e.g., 'w-[75%]')
  boxOffset?: string; // Controls the translation (e.g., 'top-3 left-3')
  textColor?: string;
  className?: string;
}

export const OffsetHeading: React.FC<OffsetHeadingProps> = ({
  text,
  boxColor = "bg-mint",
  boxWidth = "w-[80%]",
  boxOffset = "top-3 left-3",
  textColor = "text-dark",
  className = "",
}) => {
  return (
    <div className={`relative inline-block z-10 ${className}`}>
      {/* The offset background block */}
      <div className={`absolute ${boxOffset} ${boxWidth} h-full ${boxColor} -z-10`} />
      
      {/* The heading text */}
      <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight uppercase ${textColor}`}   >
        {text}
      </h2>
    </div>
  );
};