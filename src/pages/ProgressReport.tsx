import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BarChart3, CheckCircle, Clock, Calendar, Target, MapPin, Save, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { listTodayTasks, toggleTask as toggleTaskSrv, updateTaskNotes as updateTaskNotesSrv, type Task } from "@/services/goals";

type DailyTask = {
  id: string;
  title: string;
  time: string;
  type: 'event' | 'task' | 'goal';
  goalTitle?: string;
  completed: boolean;
  notes?: string | null;
};

const ProgressReport = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const data: Task[] = await listTodayTasks();
        const mapped: DailyTask[] = data.map((t) => ({
          id: t.id,
          title: t.title,
          time: (t.start_time ?? '').slice(0,5),
          type: t.type,
          completed: t.completed,
          notes: t.notes ?? undefined,
        }));
        setTasks(mapped);
      } catch (err: any) {
        console.error(err);
        toast({ title: 'Error', description: err?.message || 'Failed to load tasks', variant: 'destructive' });
      }
    })();
  }, [toast]);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      setTasks(tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
      const current = tasks.find(t => t.id === taskId);
      await toggleTaskSrv(taskId, !(current?.completed ?? false));
      toast({
        title: (current?.completed ?? false) ? 'Task Unmarked' : 'Task Completed!',
        description: `${current?.title ?? 'Task'} ${(current?.completed ?? false) ? 'unmarked' : 'marked as complete'}`,
      });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err?.message || 'Failed to update task', variant: 'destructive' });
    }
  };

  const updateTaskNotes = async (taskId: string, notes: string) => {
    try {
      setTaskNotes({ ...taskNotes, [taskId]: notes });
      setTasks(tasks.map(task => task.id === taskId ? { ...task, notes } : task));
      await updateTaskNotesSrv(taskId, notes);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err?.message || 'Failed to save notes', variant: 'destructive' });
    }
  };

  const saveProgress = () => {
    toast({ title: 'Progress Saved!', description: 'Your daily progress has been recorded successfully' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Target className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      goal: 'border-retro-green text-retro-green',
      event: 'border-retro-amber text-retro-amber',
      task: 'border-muted-foreground text-muted-foreground'
    };
    
    return (
      <Badge variant="outline" className={`font-mono-retro text-xs capitalize ${colors[type as keyof typeof colors]}`}>
        {type}
      </Badge>
    );
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-pixel text-3xl text-retro-green text-glow mb-2">
              Daily Progress Report
            </h1>
            <p className="font-mono-retro text-lg text-retro-amber text-glow-amber">
              {currentDate}
            </p>
          </div>

          {/* Progress Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="retro-card p-4 text-center">
              <BarChart3 className="h-6 w-6 text-retro-green mx-auto mb-2" />
              <div className="font-pixel text-lg text-retro-green">
                {completionPercentage}%
              </div>
              <div className="font-mono-retro text-sm text-muted-foreground">
                Complete
              </div>
            </div>
            
            <div className="retro-card p-4 text-center">
              <CheckCircle className="h-6 w-6 text-retro-amber mx-auto mb-2" />
              <div className="font-pixel text-lg text-retro-amber">
                {completedTasks}
              </div>
              <div className="font-mono-retro text-sm text-muted-foreground">
                Completed
              </div>
            </div>
            
            <div className="retro-card p-4 text-center">
              <Clock className="h-6 w-6 text-retro-green mx-auto mb-2" />
              <div className="font-pixel text-lg text-retro-green">
                {totalTasks - completedTasks}
              </div>
              <div className="font-mono-retro text-sm text-muted-foreground">
                Remaining
              </div>
            </div>
            
            <div className="retro-card p-4 text-center">
              <Target className="h-6 w-6 text-retro-amber mx-auto mb-2" />
              <div className="font-pixel text-lg text-retro-amber">
                {totalTasks}
              </div>
              <div className="font-mono-retro text-sm text-muted-foreground">
                Total Stops
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <Card className="retro-card mb-8">
            <CardHeader>
              <CardTitle className="font-pixel text-retro-green flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-retro-green/50 mx-auto mb-4" />
                  <p className="font-mono-retro text-muted-foreground">
                    No tasks scheduled for today
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="border border-retro-green/30 rounded p-4 bg-retro-crt-surface/30">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <button
                            type="button"
                            onClick={() => toggleTaskCompletion(task.id)}
                            className="h-5 w-5 inline-flex items-center justify-center"
                            aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {task.completed ? (
                              <CheckCircle className="h-4 w-4 text-retro-green" />
                            ) : (
                              <Circle className="h-4 w-4 text-retro-amber" />
                            )}
                          </button>
                          <div className="text-retro-amber">
                            {getTypeIcon(task.type)}
                          </div>
                          <h3 className={`font-mono-retro text-lg ${
                            task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}>
                            {task.title}
                          </h3>
                          {getTypeBadge(task.type)}
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <span className="font-mono-retro text-sm text-retro-amber">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {task.time}
                          </span>
                          <span className="font-mono-retro text-sm text-muted-foreground">
                            Goal: {task.goalTitle}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`notes-${task.id}`} className="font-mono-retro text-sm text-retro-amber">
                            Notes (Optional)
                          </Label>
                          <Textarea
                            id={`notes-${task.id}`}
                            value={taskNotes[task.id] || task.notes || ''}
                            onChange={(e) => updateTaskNotes(task.id, e.target.value)}
                            placeholder="Add notes about this task..."
                            className="retro-input font-mono-retro text-sm"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Save Progress */}
          <div className="text-center">
            <Button onClick={saveProgress} variant="route66" size="lg" className="font-sans bg-gradient-to-b from-route66-red to-route66-orange hover:from-route66-red/90 hover:to-route66-orange/90 text-white border-0">
              <Save className="h-4 w-4 mr-2" />
              Save Daily Progress
            </Button>
          </div>

          {/* Progress Visualization */}
          {totalTasks > 0 && (
            <Card className="retro-card mt-8">
              <CardHeader>
                <CardTitle className="font-pixel text-retro-amber flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Journey Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-mono-retro text-sm text-muted-foreground">
                      Overall Completion
                    </span>
                    <span className="font-mono-retro text-sm text-retro-green">
                      {completedTasks} / {totalTasks} stops
                    </span>
                  </div>
                  
                  <div className="h-4 bg-retro-crt-surface rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-retro-green to-retro-amber transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  
                  <div className="text-center">
                    <span className="font-pixel text-2xl text-retro-green">
                      {completionPercentage}%
                    </span>
                    <p className="font-mono-retro text-sm text-muted-foreground">
                      of today's journey completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressReport;