import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Target, MapPin, Clock, Calendar, CheckCircle, Circle, Edit, Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { listGoalsWithTasks, toggleTask, deleteTask, deleteGoal, addTask, type Task } from "@/services/goals";

interface Goal {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  createdAt?: string;
  completedAt?: string;
}

const GoalsTracker = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [newTask, setNewTask] = useState({
    title: "",
    type: "task" as "event" | "task" | "goal",
    date: "",
    startTime: "",
    endTime: "",
    notes: ""
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await listGoalsWithTasks();
        // Normalize field names to existing UI expectations
        const normalized = data.map((g: any) => ({
          id: g.id,
          title: g.title,
          description: g.description ?? "",
          createdAt: g.created_at,
          completedAt: g.completed_at ?? undefined,
          tasks: (g.tasks ?? []).map((t: any) => ({
            id: t.id,
            title: t.title,
            startTime: (t.start_time ?? "")?.slice(0,5),
            endTime: (t.end_time ?? "")?.slice(0,5),
            type: t.type,
            completed: t.completed,
            date: t.date ?? "",
          }))
        }));
        setGoals(normalized);
      } catch (err: any) {
        console.error(err);
        toast({ title: "Error", description: err?.message || "Failed to load goals", variant: "destructive" });
      }
    })();
  }, [toast]);

  const getGoalProgress = (goal: Goal) => {
    const completedTasks = goal.tasks.filter(task => task.completed).length;
    return goal.tasks.length > 0 ? (completedTasks / goal.tasks.length) * 100 : 0;
  };

  // Group repeating events by title and time, show each unique event once with date range
  const groupRepeatingEvents = (tasks: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    // Group tasks by title and time
    tasks.forEach(task => {
      const key = `${task.title}-${task.startTime}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });
    
    // Convert groups to unique events with date ranges
    return Object.values(grouped).map(taskGroup => {
      const firstTask = taskGroup[0];
      const dates = taskGroup.map(t => t.date).sort();
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      
      // Create date range string
      let dateRange = startDate;
      if (startDate !== endDate) {
        dateRange = `${startDate} - ${endDate}`;
      }
      
      return {
        ...firstTask,
        repeatCount: taskGroup.length,
        dateRange: dateRange,
        allTasks: taskGroup // Keep reference to all tasks for completion tracking
      };
    });
  };

  const toggleTaskCompletion = async (goalId: string, task: any) => {
    try {
      if (task.repeatCount > 1) {
        // For repeated events, toggle all instances
        const allCompleted = task.allTasks.every((t: any) => t.completed);
        const newCompletionStatus = !allCompleted;
        
        // Update all tasks in the group
        for (const individualTask of task.allTasks) {
          await toggleTask(individualTask.id, newCompletionStatus);
        }
        
        // Optimistic update
        setGoals((prev) => prev.map((g) => ({
          ...g,
          tasks: g.tasks.map((t) => 
            task.allTasks.some((groupTask: any) => groupTask.id === t.id) 
              ? { ...t, completed: newCompletionStatus } 
              : t
          )
        })));
        
        toast({ 
          title: "Group Updated", 
          description: `${task.repeatCount} events ${newCompletionStatus ? 'completed' : 'marked as incomplete'}` 
        });
      } else {
        // For single events, toggle normally
        setGoals((prev) => prev.map((g) => ({
          ...g,
          tasks: g.tasks.map((t) => t.id === task.id ? { ...t, completed: !t.completed } : t)
        })));
        await toggleTask(task.id, !task.completed);
        toast({ title: "Task Updated", description: "Task completion status has been updated" });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || "Failed to update task", variant: "destructive" });
    }
  };


  const handleDeleteTask = async (goalId: string, task: any) => {
    try {
      if (task.repeatCount > 1) {
        // For repeated events, delete all instances
        if (confirm(`Delete all ${task.repeatCount} instances of "${task.title}"?`)) {
          // Optimistic update - remove all tasks from UI immediately
          setGoals((prev) => prev.map((g) => ({
            ...g,
            tasks: g.tasks.filter((t) => !task.allTasks.some((groupTask: any) => groupTask.id === t.id))
          })));
          
          // Delete all tasks in the group
          for (const individualTask of task.allTasks) {
            await deleteTask(individualTask.id);
          }
          
          toast({ 
            title: "Group Deleted", 
            description: `All ${task.repeatCount} instances of "${task.title}" have been removed` 
          });
        }
      } else {
        // For single events, delete normally
        setGoals((prev) => prev.map((g) => ({
          ...g,
          tasks: g.tasks.filter((t) => t.id !== task.id)
        })));
        
        await deleteTask(task.id);
        toast({ 
          title: "Task Deleted", 
          description: `"${task.title}" has been removed from your journey` 
        });
      }
    } catch (err: any) {
      console.error(err);
      // Revert optimistic update on error
      const data = await listGoalsWithTasks();
      const normalized = data.map((g: any) => ({
        id: g.id,
        title: g.title,
        description: g.description ?? "",
        createdAt: g.created_at,
        completedAt: g.completed_at ?? undefined,
        tasks: (g.tasks ?? []).map((t: any) => ({
          id: t.id,
          title: t.title,
          startTime: (t.start_time ?? "")?.slice(0,5),
          endTime: (t.end_time ?? "")?.slice(0,5),
          type: t.type,
          completed: t.completed,
          date: t.date ?? "",
        }))
      }));
      setGoals(normalized);
      
      toast({ 
        title: "Error", 
        description: err?.message || "Failed to delete task", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    try {
      if (confirm(`Delete goal "${goalTitle}" and all its tasks? This action cannot be undone.`)) {
        // Optimistic update - remove goal from UI immediately
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
        
        await deleteGoal(goalId);
        toast({ 
          title: "Goal Deleted", 
          description: `"${goalTitle}" and all its tasks have been removed` 
        });
      }
    } catch (err: any) {
      console.error(err);
      // Revert optimistic update on error
      const data = await listGoalsWithTasks();
      const normalized = data.map((g: any) => ({
        id: g.id,
        title: g.title,
        description: g.description ?? "",
        createdAt: g.created_at,
        completedAt: g.completed_at ?? undefined,
        tasks: (g.tasks ?? []).map((t: any) => ({
          id: t.id,
          title: t.title,
          startTime: (t.start_time ?? "")?.slice(0,5),
          endTime: (t.end_time ?? "")?.slice(0,5),
          type: t.type,
          completed: t.completed,
          date: t.date ?? "",
        }))
      }));
      setGoals(normalized);
      
      toast({ 
        title: "Error", 
        description: err?.message || "Failed to delete goal", 
        variant: "destructive" 
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Target className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const toggleEventExpansion = (eventKey: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventKey)) {
        newSet.delete(eventKey);
      } else {
        newSet.add(eventKey);
      }
      return newSet;
    });
  };

  const openAddTaskDialog = (goalId: string) => {
    setSelectedGoalId(goalId);
    setNewTask({
      title: "",
      type: "task",
      date: new Date().toISOString().split('T')[0], // Today's date
      startTime: "",
      endTime: "",
      notes: ""
    });
    setIsDialogOpen(true);
  };

  const handleAddTask = async () => {
    try {
      if (!newTask.title.trim()) {
        toast({ 
          title: "Error", 
          description: "Task title is required", 
          variant: "destructive" 
        });
        return;
      }

      if (!newTask.date) {
        toast({ 
          title: "Error", 
          description: "Date is required", 
          variant: "destructive" 
        });
        return;
      }

      // Create the task
      await addTask({
        goal_id: selectedGoalId,
        title: newTask.title.trim(),
        type: newTask.type,
        date: newTask.date,
        start_time: newTask.startTime || undefined,
        end_time: newTask.endTime || undefined,
        notes: newTask.notes.trim() || undefined
      });

      // Refresh the goals data
      const data = await listGoalsWithTasks();
      const normalized = data.map((g: any) => ({
        id: g.id,
        title: g.title,
        description: g.description ?? "",
        createdAt: g.created_at,
        completedAt: g.completed_at ?? undefined,
        tasks: (g.tasks ?? []).map((t: any) => ({
          id: t.id,
          title: t.title,
          startTime: (t.start_time ?? "")?.slice(0,5),
          endTime: (t.end_time ?? "")?.slice(0,5),
          type: t.type,
          completed: t.completed,
          date: t.date ?? "",
        }))
      }));
      setGoals(normalized);

      // Close dialog and reset form
      setIsDialogOpen(false);
      setNewTask({
        title: "",
        type: "task",
        date: "",
        startTime: "",
        endTime: "",
        notes: ""
      });

      toast({ 
        title: "Task Added", 
        description: `"${newTask.title}" has been added to your goal` 
      });
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Error", 
        description: err?.message || "Failed to add task", 
        variant: "destructive" 
      });
    }
  };

  const getStatusBadge = (goal: Goal) => {
    const progress = getGoalProgress(goal);
    if (goal.completedAt) {
      return <Badge className="bg-retro-green text-retro-crt-bg">Completed</Badge>;
    } else if (progress === 0) {
      return <Badge variant="outline" className="border-retro-amber text-retro-amber">Not Started</Badge>;
    } else if (progress < 100) {
      return <Badge variant="outline" className="border-retro-green text-retro-green">In Progress</Badge>;
    } else {
      return <Badge className="bg-retro-amber text-retro-crt-bg">Ready to Complete</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-pixel text-3xl text-retro-green text-glow mb-2">
              Goal Tracker
            </h1>
            <p className="font-mono-retro text-lg text-retro-amber text-glow-amber">
              Monitor your journey progress and destinations
            </p>
          </div>

          {/* Goals Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="retro-card p-4 text-center">
              <Target className="h-6 w-6 text-retro-green mx-auto mb-2" />
              <div className="font-pixel text-lg text-retro-green">
                {goals.length}
              </div>
              <div className="font-mono-retro text-sm text-muted-foreground">
                Total Goals
              </div>
            </div>
            
            <div className="retro-card p-4 text-center">
              <CheckCircle className="h-6 w-6 text-retro-amber mx-auto mb-2" />
              <div className="font-pixel text-lg text-retro-amber">
                {goals.filter(g => g.completedAt).length}
              </div>
              <div className="font-mono-retro text-sm text-muted-foreground">
                Completed
              </div>
            </div>
            
            <div className="retro-card p-4 text-center">
              <Clock className="h-6 w-6 text-retro-green mx-auto mb-2" />
              <div className="font-pixel text-lg text-retro-green">
                {goals.filter(g => !g.completedAt).length}
              </div>
              <div className="font-mono-retro text-sm text-muted-foreground">
                Active
              </div>
            </div>
          </div>

          {/* Goals List */}
          <div className="space-y-6">
            {goals.map((goal) => (
              <Card key={goal.id} className="retro-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="h-5 w-5 text-retro-green" />
                        <CardTitle className="font-pixel text-retro-green">
                          {goal.title}
                        </CardTitle>
                        {getStatusBadge(goal)}
                      </div>
                      <p className="font-mono-retro text-muted-foreground">
                        {goal.description}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openAddTaskDialog(goal.id)}
                        title="Add task/event"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteGoal(goal.id, goal.title)}
                        title="Delete goal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono-retro text-sm text-muted-foreground">
                        Progress
                      </span>
                      <span className="font-mono-retro text-sm text-retro-green">
                        {goal.tasks.filter(t => t.completed).length} / {goal.tasks.length} tasks
                      </span>
                    </div>
                    <Progress 
                      value={getGoalProgress(goal)} 
                      className="h-2"
                    />
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-pixel text-sm text-retro-amber mb-3">
                      Journey Stops:
                    </h4>
                    
                    {goal.tasks.length === 0 ? (
                      <div className="text-center py-4">
                        <MapPin className="h-8 w-8 text-retro-green/50 mx-auto mb-2" />
                        <p className="font-mono-retro text-sm text-muted-foreground">
                          No stops planned for this goal
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {groupRepeatingEvents(goal.tasks).map((task) => {
                          const eventKey = `${goal.id}-${task.title}-${task.startTime}`;
                          const isExpanded = expandedEvents.has(eventKey);
                          
                          // Calculate completion status for grouped events
                          const isCompleted = task.repeatCount > 1 
                            ? task.allTasks.every((t: any) => t.completed)
                            : task.completed;
                          const completedCount = task.repeatCount > 1 
                            ? task.allTasks.filter((t: any) => t.completed).length
                            : (task.completed ? 1 : 0);
                          
                          return (
                            <div key={task.id}>
                              {/* Main event row */}
                              <div 
                                className={`flex items-center justify-between p-3 border border-route66-orange/30 rounded bg-route66-sand/30 ${
                                  task.repeatCount > 1 ? 'cursor-pointer hover:bg-route66-sand/40' : ''
                                }`}
                                onDoubleClick={() => task.repeatCount > 1 && toggleEventExpansion(eventKey)}
                              >
                                <div className="flex items-center gap-3">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => toggleTaskCompletion(goal.id, task)}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle className="h-4 w-4 text-retro-green" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-retro-amber" />
                                    )}
                                  </Button>
                                  
                                  <div className="text-route66-orange">
                                    {getTypeIcon(task.type)}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {task.repeatCount > 1 && (
                                      <div className="text-route66-orange">
                                        {isExpanded ? (
                                          <ChevronDown className="h-3 w-3" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3" />
                                        )}
                                      </div>
                                    )}
                                    <div>
                                      <div className={`font-mono-retro text-sm ${
                                        isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                                      }`}>
                                        {task.title}
                                      </div>
                                      <div className="font-mono-retro text-xs text-route66-orange">
                                        {task.dateRange} • {task.startTime}
                                        {task.endTime && task.endTime !== task.startTime && ` - ${task.endTime}`}
                                      </div>
                                      {task.repeatCount > 1 && (
                                        <div className="font-mono-retro text-xs text-muted-foreground">
                                          {completedCount}/{task.repeatCount} completed
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`font-mono-retro text-xs capitalize ${
                                      task.type === 'goal' ? 'border-route66-orange text-route66-orange' :
                                      task.type === 'event' ? 'border-route66-orange text-route66-orange' :
                                      'border-muted-foreground text-muted-foreground'
                                    }`}
                                  >
                                    {task.type}{task.repeatCount > 1 ? ` (×${task.repeatCount})` : ''}
                                  </Badge>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteTask(goal.id, task)}
                                    title={task.repeatCount > 1 ? "Delete all instances" : "Delete task"}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Expanded individual events */}
                              {isExpanded && task.repeatCount > 1 && (
                                <div className="ml-8 mt-2 space-y-1">
                                  {task.allTasks.map((individualTask: any, index: number) => (
                                    <div 
                                      key={individualTask.id}
                                      className="flex items-center justify-between p-2 border border-route66-orange/20 rounded bg-route66-sand/20"
                                    >
                                      <div className="flex items-center gap-3">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5"
                                          onClick={() => toggleTaskCompletion(goal.id, individualTask)}
                                        >
                                          {individualTask.completed ? (
                                            <CheckCircle className="h-3 w-3 text-retro-green" />
                                          ) : (
                                            <Circle className="h-3 w-3 text-retro-amber" />
                                          )}
                                        </Button>
                                        
                                        <div className="text-route66-orange">
                                          {getTypeIcon(individualTask.type)}
                                        </div>
                                        
                                        <div>
                                          <div className={`font-mono-retro text-xs ${
                                            individualTask.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                                          }`}>
                                            {individualTask.title}
                                          </div>
                                          <div className="font-mono-retro text-xs text-route66-orange">
                                            {individualTask.date} • {individualTask.startTime}
                                            {individualTask.endTime && individualTask.endTime !== individualTask.startTime && ` - ${individualTask.endTime}`}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <Badge 
                                          variant="outline" 
                                          className={`font-mono-retro text-xs capitalize ${
                                            individualTask.type === 'goal' ? 'border-route66-orange text-route66-orange' :
                                            individualTask.type === 'event' ? 'border-route66-orange text-route66-orange' :
                                            'border-muted-foreground text-muted-foreground'
                                          }`}
                                        >
                                          {individualTask.type}
                                        </Badge>
                                        
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => handleDeleteTask(goal.id, individualTask)}
                                          title="Delete individual task"
                                        >
                                          <Trash2 className="h-2 w-2" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {goals.length === 0 && (
            <div className="text-center py-16">
              <Target className="h-16 w-16 text-retro-green/50 mx-auto mb-4" />
              <h3 className="font-pixel text-lg text-retro-green mb-2">
                No Goals Created Yet
              </h3>
              <p className="font-mono-retro text-muted-foreground mb-6">
                Start your journey by creating your first goal
              </p>
              <Button variant="route66">
                Create Your First Goal
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] retro-card">
          <DialogHeader>
            <DialogTitle className="font-txc-bold text-route66-orange flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Add Stop
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="font-mono-retro text-retro-amber">
                Task/Event Title *
              </Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What needs to be done?"
                className="highway-input font-txc"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type" className="font-txc text-route66-orange">
                Type
              </Label>
              <Select 
                value={newTask.type} 
                onValueChange={(value: "event" | "task" | "goal") => 
                  setNewTask(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="retro-input font-mono-retro">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="goal">Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date" className="font-mono-retro text-retro-amber">
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={newTask.date}
                onChange={(e) => setNewTask(prev => ({ ...prev, date: e.target.value }))}
                className="retro-input font-mono-retro"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime" className="font-mono-retro text-retro-amber">
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newTask.startTime}
                  onChange={(e) => setNewTask(prev => ({ ...prev, startTime: e.target.value }))}
                  className="retro-input font-mono-retro"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime" className="font-mono-retro text-retro-amber">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newTask.endTime}
                  onChange={(e) => setNewTask(prev => ({ ...prev, endTime: e.target.value }))}
                  className="retro-input font-mono-retro"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes" className="font-txc text-route66-orange">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={newTask.notes}
                onChange={(e) => setNewTask(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
                className="highway-input font-txc"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="font-txc"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddTask}
              variant="route66"
              className="font-txc bg-gradient-to-b from-route66-red to-route66-orange hover:from-route66-red/90 hover:to-route66-orange/90 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stop
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoalsTracker;