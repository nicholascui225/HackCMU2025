import { Car, MapPin, Flag, Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  type: 'event' | 'task' | 'goal';
}

interface RoadVisualizationProps {
  tasks: Task[];
  currentTime?: string;
}

export const RoadVisualization = ({ tasks, currentTime = "09:00" }: RoadVisualizationProps) => {
  const getTaskIcon = (type: string, completed: boolean) => {
    if (completed) return <Flag className="h-4 w-4 text-route66-red" />;
    return <MapPin className="h-4 w-4 text-route66-orange" />;
  };

  const getTaskPosition = (index: number, total: number) => {
    // Distribute tasks along the road path
    const percentage = total > 1 ? (index / (total - 1)) * 80 + 10 : 50;
    return `${percentage}%`;
  };

  return (
    <div className="road-container vintage-card min-h-[400px] p-8">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="h-5 w-5 text-route66-red text-vintage" />
        <h2 className="font-highway text-lg text-sunset">
          Today's Journey
        </h2>
        <span className="font-americana text-route66-brown text-vintage">
          {currentTime}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Car className="h-16 w-16 text-route66-brown/50 mb-4" />
          <p className="font-americana text-lg text-muted-foreground mb-2">
            No destinations planned for today
          </p>
          <p className="font-americana text-sm text-muted-foreground">
            Add some goals and tasks to start your journey!
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Road Path */}
          <div className="road-path h-24 mb-8 relative">
            {/* Car Icon */}
            <div className="absolute top-1/2 left-8 transform -translate-y-1/2">
              <Car className="h-8 w-8 text-route66-red text-vintage animate-pulse" />
            </div>
            
            {/* Task Stops */}
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                style={{ left: getTaskPosition(index, tasks.length) }}
              >
                <div className="flex flex-col items-center">
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${task.completed 
                      ? 'bg-route66-red border-route66-red' 
                      : 'bg-card border-route66-orange'
                    }
                  `}>
                    {getTaskIcon(task.type, task.completed)}
                  </div>
                  
                  {/* Task Details */}
                  <div className="mt-8 p-3 highway-card min-w-[200px] text-center">
                    <div className="font-americana text-xs text-route66-orange mb-1">
                      {task.time}
                    </div>
                    <div className={`
                      font-americana text-sm
                      ${task.completed ? 'text-route66-red line-through' : 'text-foreground'}
                    `}>
                      {task.title}
                    </div>
                    <div className="font-americana text-xs text-muted-foreground mt-1 capitalize">
                      {task.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <span className="font-americana text-sm text-muted-foreground">
                Journey Progress
              </span>
              <span className="font-americana text-sm text-route66-red">
                {tasks.filter(t => t.completed).length} / {tasks.length} stops
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-route66-red to-route66-orange transition-all duration-500"
                style={{ 
                  width: `${tasks.length ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};