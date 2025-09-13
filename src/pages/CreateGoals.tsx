import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Target, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createGoal } from "@/services/goals";
import { useAsync } from "@/hooks/useAsync";
import { Loading } from "@/components/ui/loading";

interface Task {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'event' | 'task' | 'goal' | 'sleep' | 'eat' | 'selfcare';
}

const CreateGoals = () => {
  const { toast } = useToast();
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<{
    title: string;
    startTime: string;
    endTime: string;
    type: 'event' | 'task' | 'goal' | 'sleep' | 'eat' | 'selfcare';
  }>({
    title: "",
    startTime: "",
    endTime: "",
    type: "task"
  });

  const { execute: saveGoalAsync, loading: isSaving, error: saveError } = useAsync(createGoal);

  const addTask = () => {
    if (!newTask.title || !newTask.startTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in task title and start time",
        variant: "destructive"
      });
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      startTime: newTask.startTime,
      endTime: newTask.endTime || newTask.startTime,
      type: newTask.type
    };

    setTasks([...tasks, task]);
    setNewTask({
      title: "",
      startTime: "",
      endTime: "",
      type: "task"
    });

    toast({
      title: "Destination Added",
      description: `${task.title} scheduled for ${task.startTime}`
    });
  };

  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast({
      title: "Destination Removed",
      description: "Task removed from your journey"
    });
  };

  const saveGoal = async () => {
    if (!goalTitle) {
      toast({
        title: "Missing Goal Title",
        description: "Please enter a title for your goal",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get today's date for tasks
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayDate = `${yyyy}-${mm}-${dd}`;

      await saveGoalAsync({
        title: goalTitle,
        description: goalDescription,
        tasks: tasks.map((t) => ({
          title: t.title,
          type: t.type,
          date: todayDate, // Set tasks to today's date
          start_time: t.startTime,
          end_time: t.endTime,
        }))
      });

      toast({
        title: "Journey Planned!",
        description: `Goal "${goalTitle}" created with ${tasks.length} destinations`
      });

      setGoalTitle("");
      setGoalDescription("");
      setTasks([]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save goal",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Target className="h-4 w-4" />;
      case 'event': return <Clock className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-txc-bold text-3xl text-sunset mb-2">
              Plan Your Journey
            </h1>
            <p className="font-txc text-lg text-route66-orange">
              Create goals and map out the stops along your way
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Goal Creation Form */}
            <div className="space-y-6">
              <Card className="vintage-card">
                <CardHeader>
                  <CardTitle className="font-txc-bold text-route66-red flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="goal-title" className="font-txc text-route66-orange">
                      Goal Title
                    </Label>
                    <Input
                      id="goal-title"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="Enter your destination..."
                      className="highway-input font-txc mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="goal-description" className="font-txc text-route66-orange">
                      Description
                    </Label>
                    <Textarea
                      id="goal-description"
                      value={goalDescription}
                      onChange={(e) => setGoalDescription(e.target.value)}
                      placeholder="Describe your journey..."
                      className="highway-input font-txc mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Add Task Form */}
              <Card className="vintage-card">
                <CardHeader>
                  <CardTitle className="font-txc-bold text-route66-orange flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Add Stop
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="task-title" className="font-txc text-route66-orange">
                      Task/Event Title
                    </Label>
                    <Input
                      id="task-title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="What needs to be done?"
                      className="highway-input font-txc mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time" className="font-txc text-route66-orange">
                        Start Time
                      </Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={newTask.startTime}
                        onChange={(e) => setNewTask({...newTask, startTime: e.target.value})}
                        className="highway-input font-txc mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="end-time" className="font-txc text-route66-orange">
                        End Time (Optional)
                      </Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={newTask.endTime}
                        onChange={(e) => setNewTask({...newTask, endTime: e.target.value})}
                        className="highway-input font-txc mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="task-type" className="font-txc text-route66-orange">
                      Type
                    </Label>
                    <Select value={newTask.type} onValueChange={(value) => setNewTask({...newTask, type: value as 'event' | 'task' | 'goal' | 'sleep' | 'eat' | 'selfcare'})}>
                      <SelectTrigger className="highway-input font-txc mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="goal">Goal</SelectItem>
                        <SelectItem value="sleep">Sleep</SelectItem>
                        <SelectItem value="eat">Eat</SelectItem>
                        <SelectItem value="selfcare">Self Care</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={addTask} variant="route66" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stop
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Journey Preview */}
            <div className="space-y-6">
              <Card className="vintage-card">
                <CardHeader>
                  <CardTitle className="font-txc-bold text-route66-red flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Journey Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-route66-red/50 mx-auto mb-4" />
                      <p className="font-txc text-muted-foreground">
                        No stops planned yet
                      </p>
                      <p className="font-txc text-sm text-muted-foreground">
                        Add some tasks to see your route
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 border border-route66-red/30 rounded bg-route66-sand/20">
                            <div className="flex items-center gap-3">
                              <div className="text-route66-orange">
                                {getTypeIcon(task.type)}
                              </div>
                              <div>
                                <div className="font-txc text-sm text-foreground">
                                  {task.title}
                                </div>
                                <div className="font-txc text-xs text-route66-orange">
                                  {task.startTime}
                                  {task.endTime && task.endTime !== task.startTime && ` - ${task.endTime}`}
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => removeTask(task.id)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Goal */}
              <Button 
                onClick={saveGoal} 
                variant="desert" 
                className="w-full" 
                size="lg"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loading size="sm" text="Saving..." />
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Save Journey
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGoals;