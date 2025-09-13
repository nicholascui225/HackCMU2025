import { useState, useRef, useEffect } from 'react';
import { Road } from './Road';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCurrentTimePosition } from '@/lib/timeUtils';

interface Task {
  id: string;
  title: string;
  time: string;
  type: 'task' | 'event' | 'goal' | 'sleep' | 'eat' | 'selfcare';
}

interface Goal {
  id: string;
  title: string;
  tasks: Task[];
}

interface RoadSystemProps {
  goals: Goal[];
  currentDayTasks: Task[];
  onTaskUpdate: (goalId: string, taskId: string, updates: Partial<Task>) => void;
  onCurrentDayTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export const RoadSystem = ({ 
  goals, 
  currentDayTasks, 
  onTaskUpdate, 
  onCurrentDayTaskUpdate 
}: RoadSystemProps) => {
  const [activeRoadIndex, setActiveRoadIndex] = useState(0);
  const [currentDayVanPosition, setCurrentDayVanPosition] = useState(getCurrentTimePosition());
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(goals[0]?.id || null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize active goal
  useEffect(() => {
    if (goals.length > 0 && !activeGoalId) {
      setActiveGoalId(goals[0].id);
    }
  }, [goals, activeGoalId]);

  // Auto-scroll road signs for goal roads (non-current day)
  useEffect(() => {
    if (activeRoadIndex < goals.length) {
      const activeGoal = goals[activeRoadIndex];
      if (activeGoal && activeGoal.tasks.length > 0) {
        const interval = setInterval(() => {
          setScrollOffset(prev => prev - 1);
        }, 50);

        return () => clearInterval(interval);
      }
    }
  }, [activeRoadIndex, goals]);

  const handleVanPositionChange = (roadId: string, position: number) => {
    // All vans now show real-time position, so we don't need to track individual positions
    // The position is managed by the real-time system in each Road component
  };

  const handleTaskMove = (roadId: string, taskId: string, newTime: string) => {
    if (roadId === 'current-day') {
      onCurrentDayTaskUpdate(taskId, { time: newTime });
    } else {
      onTaskUpdate(roadId, taskId, { time: newTime });
    }
  };

  const handleVanDrop = (roadId: string) => {
    if (roadId !== 'current-day') {
      setActiveGoalId(roadId);
      setActiveRoadIndex(goals.findIndex(goal => goal.id === roadId));
    }
  };

  const handleTaskDrop = (roadId: string, taskId: string) => {
    // Handle task dropping between roads
    console.log(`Task ${taskId} dropped on road ${roadId}`);
  };

  // Removed scrollToRoad function since we now show all roads

  return (
    <div className="w-full h-full flex flex-col">
      {/* Current Day Road */}
      <div className="mb-12">
        <div className="font-txc text-lg font-bold text-route66-red mb-4 text-center">
          Current Day Journey
        </div>
        <Road
          id="current-day"
          title="Today's Route"
          tasks={currentDayTasks}
          vanPosition={0} // Not used anymore, managed internally
          isActive={true}
          isCurrentDay={true}
          onVanPositionChange={handleVanPositionChange}
          onTaskMove={handleTaskMove}
          onVanDrop={handleVanDrop}
          onTaskDrop={handleTaskDrop}
        />
      </div>

      {/* Goals Roads Section with Sandy Background */}
      <div className="flex-1 sandy-background rounded-lg p-6 overflow-y-auto">
        <div className="mb-4">
          <div className="font-txc text-lg font-bold text-route66-brown text-center">
            Goal Roads ({goals.length} total)
          </div>
        </div>

        <div className="space-y-8">
          {goals.map((goal) => (
            <Road
              key={goal.id}
              id={goal.id}
              title={goal.title}
              tasks={goal.tasks}
              vanPosition={0} // Not used anymore, managed internally
              isActive={goal.id === activeGoalId}
              onVanPositionChange={handleVanPositionChange}
              onTaskMove={handleTaskMove}
              onVanDrop={handleVanDrop}
              onTaskDrop={handleTaskDrop}
              scrollOffset={goal.id === activeGoalId ? scrollOffset : 0}
            />
          ))}
        </div>
      </div>

      {/* Road Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {goals.map((goal, index) => (
          <button
            key={index}
            onClick={() => {
              setActiveGoalId(goal.id);
              setScrollOffset(0);
            }}
            className={`w-3 h-3 rounded-full transition-colors ${
              goal.id === activeGoalId
                ? 'bg-route66-red'
                : 'bg-route66-brown/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
