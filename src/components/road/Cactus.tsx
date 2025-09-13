import { useState } from 'react';

interface CactusProps {
  id: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'saguaro' | 'barrel' | 'prickly-pear';
  position?: 'left' | 'right';
  className?: string;
}

export const Cactus = ({ 
  id, 
  size = 'medium', 
  variant = 'saguaro', 
  position = 'left',
  className = ''
}: CactusProps) => {
  const [isWiggling, setIsWiggling] = useState(false);

  const sizeClasses = {
    small: 'scale-80',
    medium: 'scale-100',
    large: 'scale-120'
  };

  const positionClasses = {
    left: 'left-3',
    right: 'right-3'
  };

  const handleClick = () => {
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 500);
  };

  const renderSaguaro = () => (
    <div className="relative">
      {/* Main trunk - simple and clean */}
      <div className="w-4 h-16 bg-green-500 rounded-full relative border-2 border-green-600">
        {/* Simple vertical lines for texture */}
        <div className="absolute inset-0 flex flex-col justify-between py-2">
          <div className="w-full h-0.5 bg-green-600 rounded-full"></div>
          <div className="w-full h-0.5 bg-green-600 rounded-full"></div>
        </div>
      </div>
      {/* Left arm - simple and clean */}
      <div className="absolute top-8 -left-2 w-3 h-8 bg-green-500 rounded-full transform -rotate-12 border-2 border-green-600">
        <div className="absolute inset-0 flex flex-col justify-center py-1">
          <div className="w-full h-0.5 bg-green-600 rounded-full"></div>
        </div>
      </div>
      {/* Right arm - simple and clean */}
      <div className="absolute top-6 -right-2 w-3 h-6 bg-green-500 rounded-full transform rotate-12 border-2 border-green-600">
        <div className="absolute inset-0 flex flex-col justify-center py-1">
          <div className="w-full h-0.5 bg-green-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  const renderBarrel = () => (
    <div className="relative">
      {/* Main body - simple barrel shape */}
      <div className="w-5 h-10 bg-green-500 rounded-full relative border-2 border-green-600">
        {/* Simple horizontal lines for texture */}
        <div className="absolute inset-0 flex flex-col justify-between py-1">
          <div className="w-full h-0.5 bg-green-600 rounded-full"></div>
          <div className="w-full h-0.5 bg-green-600 rounded-full"></div>
          <div className="w-full h-0.5 bg-green-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  const renderPricklyPear = () => (
    <div className="relative">
      {/* Bottom pad - simple oval shape */}
      <div className="w-6 h-4 bg-green-500 rounded-lg relative border-2 border-green-600">
        {/* Simple texture line */}
        <div className="absolute inset-0 flex flex-col justify-center py-1">
          <div className="w-full h-0.5 bg-green-600 rounded-full"></div>
        </div>
      </div>
      {/* Top pad - simple oval shape */}
      <div className="absolute -top-1 left-1 w-4 h-3 bg-green-500 rounded-lg transform -rotate-6 border-2 border-green-600">
        {/* Simple texture line */}
        <div className="absolute inset-0 flex flex-col justify-center py-0.5">
          <div className="w-full h-0.5 bg-green-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  const renderCactus = () => {
    switch (variant) {
      case 'barrel':
        return renderBarrel();
      case 'prickly-pear':
        return renderPricklyPear();
      default:
        return renderSaguaro();
    }
  };

  return (
    <div
      className={`
        absolute bottom-0 ${positionClasses[position]} ${sizeClasses[size]}
        cursor-pointer transition-all duration-300
        ${isWiggling ? 'animate-bounce' : 'hover:scale-105'}
        ${className}
      `}
      onClick={handleClick}
      title="Click to wiggle!"
    >
      {renderCactus()}
    </div>
  );
};
