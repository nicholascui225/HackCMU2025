import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { RoadVisualization } from "@/components/retro/road-visualization";
import { Link } from "react-router-dom";
import { PlusCircle, Target, Calendar, BarChart3 } from "lucide-react";
import { listTodayTasks, type Task as DbTask } from "@/services/goals";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; time: string; completed: boolean; type: 'event' | 'task' | 'goal'; }>>([]);
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  useEffect(() => {
    (async () => {
      try {
        const data: DbTask[] = await listTodayTasks();
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
        toast({ title: 'Error', description: err?.message || 'Failed to load today\'s tasks', variant: 'destructive' });
      }
    })();
  }, [toast]);

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-highway text-3xl text-sunset mb-2">
                Mission Control
              </h1>
              <p className="font-americana text-lg text-route66-brown text-vintage">
                {currentDate}
              </p>
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
              <div className="font-highway text-lg text-route66-red">
                {totalTasks}
              </div>
              <div className="font-americana text-sm text-muted-foreground">
                Stops Planned
              </div>
            </div>
            
            <div className="vintage-card p-4 text-center">
              <Target className="h-6 w-6 text-route66-orange mx-auto mb-2" />
              <div className="font-highway text-lg text-route66-orange">
                {completedTasks}
              </div>
              <div className="font-americana text-sm text-muted-foreground">
                Completed
              </div>
            </div>
            
            <div className="vintage-card p-4 text-center">
              <BarChart3 className="h-6 w-6 text-route66-red mx-auto mb-2" />
              <div className="font-highway text-lg text-route66-red">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </div>
              <div className="font-americana text-sm text-muted-foreground">
                Progress
              </div>
            </div>
          </div>
        </div>

        {/* Road Visualization */}
        <RoadVisualization tasks={tasks} currentTime={new Date().toTimeString().slice(0,5)} />

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/create" className="vintage-card p-6 hover:bg-route66-sand/20 transition-colors">
            <PlusCircle className="h-8 w-8 text-route66-red mb-3" />
            <h3 className="font-highway text-lg text-route66-red mb-2">
              Create Goals
            </h3>
            <p className="font-americana text-muted-foreground">
              Plan new destinations for your journey
            </p>
          </Link>
          
          <Link to="/goals" className="vintage-card p-6 hover:bg-route66-sand/20 transition-colors">
            <Target className="h-8 w-8 text-route66-orange mb-3" />
            <h3 className="font-highway text-lg text-route66-orange mb-2">
              Track Goals
            </h3>
            <p className="font-americana text-muted-foreground">
              Monitor progress towards your destinations
            </p>
          </Link>
          
          <Link to="/progress" className="vintage-card p-6 hover:bg-route66-sand/20 transition-colors">
            <BarChart3 className="h-8 w-8 text-route66-red mb-3" />
            <h3 className="font-highway text-lg text-route66-red mb-2">
              View Reports
            </h3>
            <p className="font-americana text-muted-foreground">
              Analyze your journey statistics
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;