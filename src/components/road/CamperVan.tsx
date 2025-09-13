import { useState } from 'react';
import { Car } from 'lucide-react';

interface CamperVanProps {
  id: string;
  position: number; // 0-100 percentage along the road
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onPositionChange?: (id: string, newPosition: number) => void;
  isDriving?: boolean;
}

export const CamperVan = ({ 
  id, 
  position, 
  isDragging = false,
  onDragStart,
  onDragEnd,
  onPositionChange,
  isDriving = false
}: CamperVanProps) => {
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDraggingLocal(true);
    onDragStart?.(e, id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDraggingLocal(false);
    onDragEnd?.(e);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onPositionChange) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100));
      onPositionChange(id, newPosition);
    }
  };

  return (
    <div
      className={`
        absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2
        cursor-pointer select-none z-20
        ${isDragging || isDraggingLocal ? 'opacity-50 scale-110' : 'hover:scale-105'}
        ${isDriving ? 'animate-pulse' : ''}
        transition-all duration-200
      `}
      style={{ left: `${position}%` }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      {/* Van Shadow */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm"></div>
      
      {/* Van Body */}
      <div className="relative">
        <Car className="h-8 w-8 text-route66-red drop-shadow-lg" />
        
        {/* Van Details */}
        <div className="absolute top-1 left-1 w-2 h-1 bg-white rounded-sm"></div>
        <div className="absolute top-1 right-1 w-2 h-1 bg-white rounded-sm"></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-route66-brown rounded-full"></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-route66-brown rounded-full"></div>
      </div>
      
      {/* Drag Indicator */}
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-route66-orange rounded-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </div>
  );
};
