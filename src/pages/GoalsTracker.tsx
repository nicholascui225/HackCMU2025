import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, MapPin, Clock, Calendar, CheckCircle, Circle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'event' | 'task' | 'goal';
  completed: boolean;
  date: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  createdAt: string;
  completedAt?: string;
}

// Mock data
const mockGoals: Goal[] = [
  {
    id: "1",
    title: "Complete Project Alpha",
    description: "Finish the new product feature development",
    createdAt: "2024-01-15",
    tasks: [
      {
        id: "t1",
        title: "Design wireframes",
        startTime: "09:00",
        endTime: "11:00",
        type: "task",
        completed: true,
        date: "2024-01-15"
      },
      {
        id: "t2",
        title: "Code implementation",
        startTime: "14:00",
        endTime: "17:00",
        type: "task",
        completed: true,
        date: "2024-01-16"
      },
      {
        id: "t3",
        title: "Testing & QA",
        startTime: "10:00",
        endTime: "12:00",
        type: "task",
        completed: false,
        date: "2024-01-17"
      },
      {
        id: "t4",
        title: "Team review meeting",
        startTime: "15:00",
        endTime: "16:00",
        type: "event",
        completed: false,
        date: "2024-01-18"
      }
    ]
  },
  {
    id: "2",
    title: "Health & Fitness Journey",
    description: "Establish a consistent workout routine",
    createdAt: "2024-01-10",
    completedAt: "2024-01-20",
    tasks: [
      {
        id: "t5",
        title: "Morning run",
        startTime: "07:00",
        endTime: "08:00",
        type: "task",
        completed: true,
        date: "2024-01-10"
      },
      {
        id: "t6",
        title: "Gym workout",
        startTime: "18:00",
        endTime: "19:30",
        type: "task",
        completed: true,
        date: "2024-01-11"
      },
      {
        id: "t7",
        title: "Nutrition planning",
        startTime: "12:00",
        endTime: "13:00",
        type: "goal",
        completed: true,
        date: "2024-01-12"
      }
    ]
  }
];

const GoalsTracker = () => {
  const { toast } = useToast();
  const [goals] = useState<Goal[]>(mockGoals);

  const getGoalProgress = (goal: Goal) => {
    const completedTasks = goal.tasks.filter(task => task.completed).length;
    return goal.tasks.length > 0 ? (completedTasks / goal.tasks.length) * 100 : 0;
  };

  const toggleTaskCompletion = (goalId: string, taskId: string) => {
    toast({
      title: "Task Updated",
      description: "Task completion status has been updated",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Target className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
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
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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
                        {goal.tasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="flex items-center justify-between p-3 border border-retro-green/30 rounded bg-retro-crt-surface/30"
                          >
                            <div className="flex items-center gap-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleTaskCompletion(goal.id, task.id)}
                              >
                                {task.completed ? (
                                  <CheckCircle className="h-4 w-4 text-retro-green" />
                                ) : (
                                  <Circle className="h-4 w-4 text-retro-amber" />
                                )}
                              </Button>
                              
                              <div className="text-retro-amber">
                                {getTypeIcon(task.type)}
                              </div>
                              
                              <div>
                                <div className={`font-mono-retro text-sm ${
                                  task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}>
                                  {task.title}
                                </div>
                                <div className="font-mono-retro text-xs text-retro-amber">
                                  {task.date} • {task.startTime}
                                  {task.endTime && task.endTime !== task.startTime && ` - ${task.endTime}`}
                                </div>
                              </div>
                            </div>
                            
                            <Badge 
                              variant="outline" 
                              className={`font-mono-retro text-xs capitalize ${
                                task.type === 'goal' ? 'border-retro-green text-retro-green' :
                                task.type === 'event' ? 'border-retro-amber text-retro-amber' :
                                'border-muted-foreground text-muted-foreground'
                              }`}
                            >
                              {task.type}
                            </Badge>
                          </div>
                        ))}
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
    </div>
  );
};

export default GoalsTracker;