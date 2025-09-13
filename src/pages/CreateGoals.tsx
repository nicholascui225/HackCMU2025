import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Target, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addTask, createGoal, listGoals, type Goal } from "@/services/goals";

const CreateGoals = () => {
  const { toast } = useToast();
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");

  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");

  const [newTask, setNewTask] = useState<{
    title: string;
    goalId: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'event' | 'task';
  }>({
    title: "",
    goalId: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "task"
  });

  const timeOptions = useMemo(() => {
    const times: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        times.push(`${hh}:${mm}`);
      }
    }
    return times;
  }, []);

  useEffect(() => {
    console.log("[CreateGoals] mount -> loading goals");
    (async () => {
      try {
        const data = await listGoals();
        console.log("[CreateGoals] goals loaded:", data?.length);
        setGoals(data);
      } catch (err: any) {
        console.error("[CreateGoals] load goals error:", err);
        toast({ title: "Error", description: err?.message || "Failed to load goals", variant: "destructive" });
      }
    })();
  }, [toast]);

  const handleAddGoal = async () => {
    if (!goalTitle.trim()) {
      toast({ title: "Missing Goal Title", description: "Please enter a goal title", variant: "destructive" });
      return;
    }
    try {
      console.log("[CreateGoals] creating goal:", { title: goalTitle, description: goalDescription });
      await createGoal({ title: goalTitle.trim(), description: goalDescription.trim() || undefined });
      toast({ title: "Goal Created", description: `"${goalTitle}" has been added` });
      setGoalTitle("");
      setGoalDescription("");
      const data = await listGoals();
      console.log("[CreateGoals] goals refreshed:", data?.length);
      setGoals(data);
    } catch (err: any) {
      console.error("[CreateGoals] create goal error:", err);
      toast({ title: "Error", description: err?.message || "Failed to create goal", variant: "destructive" });
    }
  };

  const addStop = async () => {
    if (!newTask.title || !newTask.goalId || !newTask.date || !newTask.startTime) {
      toast({ title: "Missing Information", description: "Fill goal, title, date and start time", variant: "destructive" });
      return;
    }
    try {
      console.log("[CreateGoals] adding stop:", newTask);
      await addTask({
        goal_id: newTask.goalId,
        title: newTask.title,
        type: newTask.type,
        date: newTask.date,
        start_time: newTask.startTime,
        end_time: newTask.endTime || undefined,
      });
      toast({ title: "Stop Added", description: `${newTask.title} scheduled for ${newTask.date} ${newTask.startTime}` });
      setNewTask({ title: "", goalId: "", date: "", startTime: "", endTime: "", type: "task" });
    } catch (err: any) {
      console.error("[CreateGoals] add stop error:", err);
      toast({ title: "Error", description: err?.message || "Failed to add stop", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-txc-bold text-3xl text-sunset mb-2">
              Plan Your Journey
            </h1>
            <p className="font-txc text-lg text-route66-orange">
              Create goals and map out the stops along your way
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Left: Goal Creation */}
            <div className="space-y-6 flex flex-col h-full">
              <Card className="retro-card h-full">
                <CardHeader>
                  <CardTitle className="font-txc-bold text-route66-red flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex flex-col h-full">
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

                  <Button onClick={handleAddGoal} variant="desert" className="w-full mt-auto">
                    <Target className="h-4 w-4 mr-2" />
                    Add Goal
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right: Add Stop */}
            <div className="space-y-6 flex flex-col h-full">
              <Card className="retro-card h-full">
                <CardHeader>
                  <CardTitle className="font-txc-bold text-route66-orange flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Add Stop
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="goal-select" className="font-mono-retro text-retro-amber">
                      Goal
                    </Label>
                    <Select value={newTask.goalId || undefined} onValueChange={(value) => { setNewTask({ ...newTask, goalId: value }); setSelectedGoalId(value); }}>
                      <SelectTrigger id="goal-select" className="retro-input font-mono-retro mt-1">
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {goals.length === 0 ? (
                          <SelectItem value="no_goals" disabled>No goals yet</SelectItem>
                        ) : (
                          goals.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="task-title" className="font-mono-retro text-retro-amber">
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

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="date" className="font-mono-retro text-retro-amber">
                        Date
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={newTask.date}
                        onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                        className="retro-input font-mono-retro mt-1"
                      />
                    </div>
                    <div>
                      <Label className="font-mono-retro text-retro-amber">
                        Start Time
                      </Label>
                      <Select value={newTask.startTime || undefined} onValueChange={(value) => setNewTask({ ...newTask, startTime: value })}>
                        <SelectTrigger className="retro-input font-mono-retro mt-1">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="font-mono-retro text-retro-amber">
                        End Time
                      </Label>
                      <Select value={newTask.endTime || undefined} onValueChange={(value) => setNewTask({ ...newTask, endTime: value })}>
                        <SelectTrigger className="retro-input font-mono-retro mt-1">
                          <SelectValue placeholder="Select time (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="task-type" className="font-txc text-route66-orange">
                      Type
                    </Label>
                    <Select value={newTask.type} onValueChange={(value) => setNewTask({...newTask, type: value as 'event' | 'task'})}>
                      <SelectTrigger className="retro-input font-mono-retro mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={addStop} variant="route66" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stop
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGoals;