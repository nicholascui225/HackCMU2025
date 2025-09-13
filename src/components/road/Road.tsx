import { useState, useRef, useEffect } from 'react';
import { RoadSign } from './RoadSign';
import { CamperVan } from './CamperVan';
import { Cactus } from './Cactus';
import { timeToPosition, getCurrentTimePosition, calculateScrollOffset, generateTimeScaleMarkers, generateHourMarkers } from '@/lib/timeUtils';

interface Task {
  id: string;
  title: string;
  time: string;
  type: 'task' | 'event' | 'goal' | 'sleep' | 'eat' | 'selfcare';
}

interface RoadProps {
  id: string;
  title: string;
  tasks: Task[];
  vanPosition: number;
  isActive: boolean;
  isCurrentDay?: boolean;
  onVanPositionChange: (roadId: string, position: number) => void;
  onTaskMove: (roadId: string, taskId: string, newTime: string) => void;
  onVanDrop: (roadId: string) => void;
  onTaskDrop: (roadId: string, taskId: string) => void;
  scrollOffset?: number;
}

export const Road = ({ 
  id, 
  title, 
  tasks, 
  vanPosition, 
  isActive, 
  isCurrentDay = false,
  onVanPositionChange,
  onTaskMove,
  onVanDrop,
  onTaskDrop,
  scrollOffset = 0
}: RoadProps) => {
  const roadRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [currentTimePosition, setCurrentTimePosition] = useState(getCurrentTimePosition());

  // Sort tasks by time
  const sortedTasks = [...tasks].sort((a, b) => a.time.localeCompare(b.time));

  // Update current time position for all roads to show real-time
  useEffect(() => {
    const updateTimePosition = () => {
      setCurrentTimePosition(getCurrentTimePosition());
    };
    
    updateTimePosition(); // Initial update
    const interval = setInterval(updateTimePosition, 1000); // Update every second for smooth movement
    
    return () => clearInterval(interval);
  }, []); // Run for all roads, not just current day

  // Calculate van position - for current day road and active goal road
  const getVanPosition = () => {
    // Show van on current day road and active goal road at real-time position
    if (isCurrentDay || isActive) {
      // Use current time position, or fallback to 50% if not yet calculated
      const position = currentTimePosition > 0 ? currentTimePosition : 50;
      console.log('Van position for road:', id, 'isCurrentDay:', isCurrentDay, 'isActive:', isActive, 'position:', position, 'currentTimePosition:', currentTimePosition);
      return position;
    }
    // Other roads don't show vans, so return 0
    return 0;
  };

  // Calculate scroll offset - don't auto-scroll for current day or active road, let tasks stay in their time positions
  const getScrollOffset = () => {
    // For current day road and active road, don't apply scroll offset - let tasks stay in their time positions
    if (isCurrentDay || isActive) {
      return 0;
    }
    return scrollOffset;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemType = e.dataTransfer.getData('itemType');
    const itemId = e.dataTransfer.getData('itemId');
    
    if (itemType === 'van') {
      onVanDrop(id);
    } else if (itemType === 'task') {
      onTaskDrop(id, itemId);
    }
  };

  const handleVanDragStart = (e: React.DragEvent, vanId: string) => {
    e.dataTransfer.setData('itemType', 'van');
    e.dataTransfer.setData('itemId', vanId);
    setIsDragging(true);
  };

  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('itemType', 'task');
    e.dataTransfer.setData('itemId', taskId);
    setDraggedItem(taskId);
  };

  const handleTimeChange = (taskId: string, newTime: string) => {
    onTaskMove(id, taskId, newTime);
  };

  const handleVanPositionChange = (vanId: string, newPosition: number) => {
    onVanPositionChange(id, newPosition);
  };

  return (
    <div className="relative">
      {/* Road Signs Above - Positioned above the road */}
      <div className="relative h-24 mb-2">
        <div 
          className="flex items-center h-full gap-8 px-4 overflow-hidden"
          style={{ transform: `translateX(${getScrollOffset()}px)` }}
        >
          {sortedTasks.map((task) => {
            const taskPosition = timeToPosition(task.time);
            return (
              <div
                key={task.id}
                className="absolute"
                style={{ left: `${taskPosition}%`, transform: 'translateX(-50%)' }}
              >
                <RoadSign
                  id={task.id}
                  title={task.title}
                  time={task.time}
                  type={task.type}
                  onDragStart={handleTaskDragStart}
                  onDragEnd={() => setDraggedItem(null)}
                  onTimeChange={handleTimeChange}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Road Container */}
      <div 
        ref={roadRef}
        className={`
          relative h-32 bg-gradient-to-r from-route66-brown/20 via-route66-brown to-route66-brown/20
          border-t-2 border-b-2 border-route66-brown
          ${isActive ? 'ring-2 ring-route66-orange' : ''}
          ${isCurrentDay ? 'bg-gradient-to-r from-route66-red/30 via-route66-red to-route66-red/30' : ''}
          transition-all duration-300
        `}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Timeline Scale - 24 Hour Scale */}
        <div className="absolute -top-8 left-0 right-0 h-6">
          {/* Major time markers every 2 hours */}
          {generateTimeScaleMarkers().map((marker, index) => (
            <div
              key={index}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${marker.position}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-0.5 h-3 bg-route66-brown"></div>
              <span className="font-txc text-xs text-route66-brown mt-1 whitespace-nowrap">
                {marker.label}
              </span>
            </div>
          ))}
        </div>

        {/* Hour markers - smaller lines for each hour */}
        <div className="absolute -top-6 left-0 right-0 h-2">
          {generateHourMarkers().map((marker, index) => (
            <div
              key={index}
              className="absolute top-0"
              style={{ left: `${marker.position}%`, transform: 'translateX(-50%)' }}
            >
              <div className={`w-0.5 ${marker.isMajor ? 'h-2 bg-route66-brown' : 'h-1 bg-route66-brown/60'}`}></div>
            </div>
          ))}
        </div>

        {/* Road Lines */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-route66-yellow transform -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-route66-yellow transform -translate-y-1/2 opacity-50" style={{ 
          background: 'repeating-linear-gradient(90deg, transparent, transparent 20px, hsl(var(--route66-yellow)) 20px, hsl(var(--route66-yellow)) 40px)'
        }}></div>

        {/* Current Time Indicator Line - Show on all roads */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-route66-red transform -translate-x-1/2 z-10"
          style={{ left: `${currentTimePosition}%` }}
        >
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-route66-red rounded-full"></div>
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-xs font-txc text-route66-red bg-white px-1 rounded whitespace-nowrap">
            NOW
          </div>
        </div>

        {/* Road Title */}
        <div className="absolute -top-12 left-4 font-txc text-sm font-bold text-route66-brown bg-route66-sand/80 px-2 py-1 rounded">
          {title}
        </div>

        {/* Current Day Indicator */}
        {isCurrentDay && (
          <div className="absolute -top-12 right-4 font-txc text-xs font-bold text-route66-red bg-white px-2 py-1 rounded border border-route66-red">
            TODAY
          </div>
        )}

        {/* Van - Show on current day road and active goal road */}
        {(isCurrentDay || isActive) && (
          <CamperVan
            id={`van-${id}`}
            position={getVanPosition()}
            isDragging={isDragging}
            onDragStart={handleVanDragStart}
            onDragEnd={() => setIsDragging(false)}
            onPositionChange={handleVanPositionChange}
            isDriving={isCurrentDay}
          />
        )}

        {/* Cacti Decorations - Only saguaro on the left */}
        <Cactus 
          id={`cactus-left-${id}`} 
          variant="saguaro" 
          size="medium" 
          position="left"
          className="opacity-80"
        />

        {/* Road End Markers */}
        <div className="absolute top-1/2 -left-2 w-4 h-4 bg-route66-brown transform -translate-y-1/2 rotate-45"></div>
        <div className="absolute top-1/2 -right-2 w-4 h-4 bg-route66-brown transform -translate-y-1/2 rotate-45"></div>
      </div>
    </div>
  );
};
