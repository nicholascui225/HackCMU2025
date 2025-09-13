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
  onTaskToggle?: (taskId: string) => void;
}

export const RoadVisualization = ({ tasks, currentTime = "09:00", onTaskToggle }: RoadVisualizationProps) => {
  const getTaskIcon = (type: string, completed: boolean) => {
    if (completed) return <Flag className="h-4 w-4 text-route66-red" />;
    return <MapPin className="h-4 w-4 text-route66-orange" />;
  };

  const getTaskPosition = (index: number, total: number) => {
    // Distribute tasks along the road path
    const percentage = total > 1 ? (index / (total - 1)) * 80 + 10 : 50;
    return `${percentage}%`;
  };

  const getTaskTitleStyle = (title: string) => {
    const length = title.length;
    if (length <= 15) return "text-sm";
    if (length <= 25) return "text-xs";
    if (length <= 35) return "text-xs leading-tight";
    return "text-xs leading-tight";
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  return (
    <div className="road-container vintage-card min-h-[400px] p-6">
      <div className="flex items-center gap-4 mb-12 py-4">
        <Clock className="h-6 w-6 text-route66-red text-vintage" />
        <h2 className="font-txc-bold text-xl text-sunset">
          Today's Journey
        </h2>
        <span className="font-txc text-lg text-route66-brown text-vintage">
          {currentTime}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Car className="h-16 w-16 text-route66-brown/50 mb-4" />
          <p className="font-txc text-lg text-muted-foreground mb-2">
            No destinations planned for today
          </p>
          <p className="font-txc text-sm text-muted-foreground">
            Add some goals and tasks to start your journey!
          </p>
        </div>
      ) : (
        <div className="relative px-2">
          {/* Road Path */}
          <div className="road-path h-24 mb-20 relative">
            {/* Task Stops */}
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                style={{ left: getTaskPosition(index, tasks.length) }}
              >
                <div className="flex flex-col items-center">
                  <div 
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110
                      ${task.completed 
                        ? 'bg-route66-red border-route66-red' 
                        : 'bg-card border-route66-orange hover:bg-route66-orange/20'
                      }
                    `}
                    onClick={() => onTaskToggle?.(task.id)}
                    title={task.completed ? "Mark as incomplete" : "Mark as complete"}
                  >
                    {getTaskIcon(task.type, task.completed)}
                  </div>
                  
                  {/* Task Details */}
                  <div className="mt-8 p-2 highway-card max-w-[160px] min-w-[120px] text-center">
                    <div className="font-txc text-xs text-route66-orange mb-1">
                      {task.time}
                    </div>
                    <div className={`
                      font-txc ${getTaskTitleStyle(task.title)}
                      ${task.completed ? 'text-route66-red line-through' : 'text-foreground'}
                      break-words
                    `}>
                      {truncateTitle(task.title, 25)}
                    </div>
                    <div className="font-txc text-xs text-muted-foreground mt-1 capitalize">
                      {task.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-16">
            <div className="flex justify-between items-center mb-2">
              <span className="font-txc text-sm text-muted-foreground">
                Journey Progress
              </span>
              <span className="font-txc text-sm text-route66-red">
                {tasks.filter(t => t.completed).length} / {tasks.length} stops
              </span>
            </div>
            <div className="relative">
              {/* Van Icon above Progress Bar */}
              <div 
                className="absolute -top-12 transform -translate-x-1/2 transition-all duration-500 z-10"
                style={{ 
                  left: `${tasks.length ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` 
                }}
              >
                <Car className="h-12 w-12 text-route66-red text-vintage animate-pulse" />
              </div>
              
              {/* Progress Bar */}
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
        </div>
      )}
    </div>
  );
};