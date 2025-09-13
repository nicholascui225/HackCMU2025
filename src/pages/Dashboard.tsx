import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { RoadVisualization } from "@/components/retro/road-visualization";
import { Link } from "react-router-dom";
import { PlusCircle, Target, Calendar, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { listTodayTasks, listTasksForDate, toggleTask, type Task as DbTask } from "@/services/goals";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; time: string; completed: boolean; type: DbTask['type']; }>>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Helper functions for date navigation
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  useEffect(() => {
    (async () => {
      try {
        const dateStr = formatDateForAPI(selectedDate);
        const data: DbTask[] = await listTasksForDate(dateStr);
        const mapped = data.map((t) => ({
          id: t.id,
          title: t.title,
          time: (t.start_time ?? '').slice(0,5),
          completed: t.completed,
          type: t.type,
        }));
        setTasks(mapped);
      } catch (err: any) {
        console.error(err);
        const dateLabel = isToday(selectedDate) ? 'today\'s' : formatDate(selectedDate);
        toast({ title: 'Error', description: err?.message || `Failed to load ${dateLabel} tasks`, variant: 'destructive' });
      }
    })();
  }, [selectedDate, toast]);

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  const handleTaskToggle = async (taskId: string) => {
    try {
      // Find the current task to get its current completion status
      const currentTask = tasks.find(t => t.id === taskId);
      if (!currentTask) return;

      // Optimistic update
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed }
          : task
      ));

      // Update in database
      await toggleTask(taskId, !currentTask.completed);
      
      toast({ 
        title: "Task Updated", 
        description: `Task ${!currentTask.completed ? 'completed' : 'marked as incomplete'}` 
      });
    } catch (err: any) {
      console.error(err);
      // Revert optimistic update on error
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed }
          : task
      ));
      toast({ 
        title: "Error", 
        description: err?.message || "Failed to update task", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-txc-bold text-3xl text-sunset mb-2">
                Mission Control
              </h1>
              
              {/* Date Navigation */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => navigateDate('prev')}
                    variant="outline"
                    size="sm"
                    className="font-txc border-route66-orange text-route66-orange hover:bg-route66-orange/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-center min-w-[200px]">
                    <p className="font-txc text-lg text-route66-brown text-vintage">
                      {formatDate(selectedDate)}
                    </p>
                    {!isToday(selectedDate) && (
                      <Button
                        onClick={goToToday}
                        variant="ghost"
                        size="sm"
                        className="font-txc text-xs text-muted-foreground hover:text-route66-orange"
                      >
                        Go to Today
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => navigateDate('next')}
                    variant="outline"
                    size="sm"
                    className="font-txc border-route66-orange text-route66-orange hover:bg-route66-orange/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link to="/create">
                <Button variant="route66" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add Destination
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="vintage-card p-4 text-center">
              <Calendar className="h-6 w-6 text-route66-red mx-auto mb-2" />
              <div className="font-txc-bold text-lg text-route66-red">
                {totalTasks}
              </div>
              <div className="font-txc text-sm text-muted-foreground">
                {isToday(selectedDate) ? 'Stops Planned' : 'Planned'}
              </div>
            </div>
            
            <div className="vintage-card p-4 text-center">
              <Target className="h-6 w-6 text-route66-orange mx-auto mb-2" />
              <div className="font-txc-bold text-lg text-route66-orange">
                {completedTasks}
              </div>
              <div className="font-txc text-sm text-muted-foreground">
                Completed
              </div>
            </div>
            
            <div className="vintage-card p-4 text-center">
              <BarChart3 className="h-6 w-6 text-route66-red mx-auto mb-2" />
              <div className="font-txc-bold text-lg text-route66-red">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </div>
              <div className="font-txc text-sm text-muted-foreground">
                Progress
              </div>
            </div>
          </div>
        </div>

        {/* Road Visualization */}
        <RoadVisualization 
          tasks={tasks} 
          currentTime={isToday(selectedDate) ? new Date().toTimeString().slice(0,5) : undefined} 
          onTaskToggle={handleTaskToggle}
        />

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/create" className="vintage-card p-6 hover:bg-route66-sand/20 transition-colors">
            <PlusCircle className="h-8 w-8 text-route66-red mb-3" />
            <h3 className="font-txc-bold text-lg text-route66-red mb-2">
              Create Goals
            </h3>
            <p className="font-txc text-muted-foreground">
              Plan new destinations for your journey
            </p>
          </Link>
          
          <Link to="/goals" className="vintage-card p-6 hover:bg-route66-sand/20 transition-colors">
            <Target className="h-8 w-8 text-route66-orange mb-3" />
            <h3 className="font-txc-bold text-lg text-route66-orange mb-2">
              Track Goals
            </h3>
            <p className="font-txc text-muted-foreground">
              Monitor progress towards your destinations
            </p>
          </Link>
          
          <Link to="/progress" className="vintage-card p-6 hover:bg-route66-sand/20 transition-colors">
            <BarChart3 className="h-8 w-8 text-route66-red mb-3" />
            <h3 className="font-txc-bold text-lg text-route66-red mb-2">
              View Reports
            </h3>
            <p className="font-txc text-muted-foreground">
              Analyze your journey statistics
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;