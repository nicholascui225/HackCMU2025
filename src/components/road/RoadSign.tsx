import { useState } from 'react';
import { Clock, MapPin, Target, Home, Fuel } from 'lucide-react';

interface RoadSignProps {
  id: string;
  title: string;
  time: string;
  type: 'task' | 'event' | 'goal' | 'sleep' | 'eat' | 'selfcare';
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onTimeChange?: (id: string, newTime: string) => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'goal': return <Target className="h-4 w-4" />;
    case 'event': return <Clock className="h-4 w-4" />;
    case 'sleep': return <Home className="h-4 w-4" />;
    case 'eat':
    case 'selfcare': return <Fuel className="h-4 w-4" />;
    default: return <MapPin className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'goal': return 'bg-route66-red';
    case 'event': return 'bg-route66-orange';
    case 'sleep': return 'bg-route66-brown';
    case 'eat':
    case 'selfcare': return 'bg-route66-yellow';
    default: return 'bg-route66-orange';
  }
};

export const RoadSign = ({ 
  id, 
  title, 
  time, 
  type, 
  isDragging = false,
  onDragStart,
  onDragEnd,
  onTimeChange 
}: RoadSignProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTime, setEditTime] = useState(time);

  const handleTimeEdit = () => {
    if (onTimeChange) {
      onTimeChange(id, editTime);
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTimeEdit();
    } else if (e.key === 'Escape') {
      setEditTime(time);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`
        relative group cursor-move select-none
        ${isDragging ? 'opacity-50 scale-105' : 'hover:scale-105'}
        transition-all duration-200
      `}
      draggable
      onDragStart={(e) => onDragStart?.(e, id)}
      onDragEnd={onDragEnd}
    >
      {/* Sign Post */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-route66-brown"></div>
      
      {/* Road Sign Shape */}
      <div className={`
        relative px-4 py-3 border-2 border-route66-brown
        ${getTypeColor(type)} text-white shadow-lg
        min-w-[140px] text-center
        ${type === 'sleep' ? 'rounded-full' : type === 'eat' || type === 'selfcare' ? 'rounded-lg' : 'rounded-sm'}
      `}>
        {/* Sign Content */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {getTypeIcon(type)}
          <span className="font-txc text-xs font-bold">
            {type.toUpperCase()}
          </span>
        </div>
        
        <div className="font-txc text-sm font-bold mb-2 leading-tight">
          {title}
        </div>
        
        {/* Time Display */}
        <div 
          className="font-txc text-xs cursor-pointer hover:bg-white/20 rounded px-2 py-1 border border-white/30"
          onClick={() => setIsEditing(true)}
        >
          {isEditing ? (
            <input
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              onBlur={handleTimeEdit}
              onKeyDown={handleKeyPress}
              className="bg-transparent text-white text-center w-full font-txc text-xs"
              autoFocus
            />
          ) : (
            time
          )}
        </div>
      </div>
      
      {/* Drag Handle */}
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-route66-orange rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </div>
  );
};
