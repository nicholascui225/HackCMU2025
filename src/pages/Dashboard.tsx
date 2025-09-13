import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { RoadSystem } from "@/components/road/RoadSystem";
import { Link } from "react-router-dom";
import { PlusCircle, Target, Calendar, BarChart3, Database } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { listGoalsWithTasks, listTodayTasks } from "@/services/goals";
import { Loading } from "@/components/ui/loading";
// Import setup function - we'll define it inline for now
import { createGoal } from "@/services/goals";

// Mock data for demonstration
const mockGoals = [
  {
    id: "1",
    title: "Work Project",
    tasks: [
      { id: "1", title: "Morning Standup", time: "09:00", type: "event" as const },
      { id: "2", title: "Code Review", time: "10:30", type: "task" as const },
      { id: "3", title: "Lunch Break", time: "12:00", type: "eat" as const },
      { id: "4", title: "Feature Development", time: "14:00", type: "task" as const },
    ]
  },
  {
    id: "2", 
    title: "Personal Goals",
    tasks: [
      { id: "5", title: "Gym Session", time: "18:00", type: "task" as const },
      { id: "6", title: "Dinner", time: "19:30", type: "eat" as const },
      { id: "7", title: "Reading Time", time: "20:30", type: "task" as const },
    ]
  },
  {
    id: "3",
    title: "Health & Wellness",
    tasks: [
      { id: "8", title: "Morning Run", time: "07:00", type: "task" as const },
      { id: "9", title: "Meditation", time: "07:30", type: "selfcare" as const },
      { id: "10", title: "Sleep", time: "22:00", type: "sleep" as const },
    ]
  }
];

const mockCurrentDayTasks = [
  { id: "11", title: "Wake Up", time: "07:00", type: "task" as const },
  { id: "12", title: "Breakfast", time: "08:00", type: "eat" as const },
  { id: "13", title: "Work Meeting", time: "09:00", type: "event" as const },
  { id: "14", title: "Lunch", time: "12:00", type: "eat" as const },
  { id: "15", title: "Afternoon Work", time: "13:00", type: "task" as const },
  { id: "16", title: "Dinner", time: "19:00", type: "eat" as const },
  { id: "17", title: "Sleep", time: "22:00", type: "sleep" as const },
];

const Dashboard = () => {
  const [goals, setGoals] = useState([]);
  const [currentDayTasks, setCurrentDayTasks] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const { execute: loadGoals, loading: goalsLoading } = useAsync(listGoalsWithTasks);
  const { execute: loadTodayTasks, loading: todayTasksLoading } = useAsync(listTodayTasks);
  const { execute: setupData, loading: setupLoading } = useAsync(async () => {
    // Create the 3 goals with their tasks
    const goalsToCreate = [
      {
        title: "Work Project",
        description: "Professional development and work-related objectives",
        tasks: [
          { title: "Morning Standup", type: "event", date: "2024-01-15", start_time: "09:00", end_time: "09:30", notes: "Daily team sync" },
          { title: "Code Review", type: "task", date: "2024-01-15", start_time: "10:30", end_time: "11:30", notes: "Review pull requests" },
          { title: "Lunch Break", type: "eat", date: "2024-01-15", start_time: "12:00", end_time: "13:00" },
          { title: "Feature Development", type: "task", date: "2024-01-15", start_time: "14:00", end_time: "17:00", notes: "Work on new dashboard feature" }
        ]
      },
      {
        title: "Personal Goals",
        description: "Personal growth and life objectives",
        tasks: [
          { title: "Gym Session", type: "task", date: "2024-01-15", start_time: "18:00", end_time: "19:00", notes: "Strength training" },
          { title: "Dinner", type: "eat", date: "2024-01-15", start_time: "19:30", end_time: "20:30" },
          { title: "Reading Time", type: "task", date: "2024-01-15", start_time: "20:30", end_time: "21:30", notes: "Read for 1 hour" }
        ]
      },
      {
        title: "Health & Wellness",
        description: "Physical and mental health objectives",
        tasks: [
          { title: "Morning Run", type: "task", date: "2024-01-15", start_time: "07:00", end_time: "07:30", notes: "30-minute jog" },
          { title: "Meditation", type: "selfcare", date: "2024-01-15", start_time: "07:30", end_time: "08:00", notes: "Mindfulness practice" },
          { title: "Sleep", type: "sleep", date: "2024-01-15", start_time: "22:00", end_time: "07:00", notes: "Get 9 hours of sleep" }
        ]
      }
    ];

    // Create each goal
    for (const goalData of goalsToCreate) {
      await createGoal(goalData);
    }

    // Also create some standalone current day tasks (not linked to goals)
    const standaloneTasks = [
      { title: "Wake Up", type: "task", date: "2024-01-15", start_time: "07:00", end_time: "07:15" },
      { title: "Breakfast", type: "eat", date: "2024-01-15", start_time: "08:00", end_time: "08:30" },
      { title: "Work Meeting", type: "event", date: "2024-01-15", start_time: "09:00", end_time: "10:00" },
      { title: "Lunch", type: "eat", date: "2024-01-15", start_time: "12:00", end_time: "13:00" },
      { title: "Afternoon Work", type: "task", date: "2024-01-15", start_time: "13:00", end_time: "17:00" },
      { title: "Dinner", type: "eat", date: "2024-01-15", start_time: "19:00", end_time: "20:00" },
      { title: "Sleep", type: "sleep", date: "2024-01-15", start_time: "22:00", end_time: "07:00" }
    ];

    // Create standalone tasks
    await createGoal({
      title: "Daily Tasks",
      description: "Standalone daily tasks",
      tasks: standaloneTasks
    });

    return "Data setup complete";
  });

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [goalsData, todayTasksData] = await Promise.all([
        loadGoals(),
        loadTodayTasks()
      ]);
      
      setGoals(goalsData || []);
      setCurrentDayTasks(todayTasksData || []);
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to mock data if database is not available
      setGoals(mockGoals);
      setCurrentDayTasks(mockCurrentDayTasks);
      setIsDataLoaded(true);
    }
  };

  const handleSetupData = async () => {
    try {
      await setupData();
      // Reload data after setup
      await loadData();
    } catch (error) {
      console.error('Error setting up data:', error);
    }
  };

  const completedTasks = currentDayTasks.filter(task => task.completed).length;
  const totalTasks = currentDayTasks.length;

  const handleTaskUpdate = (goalId: string, taskId: string, updates: Partial<any>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? {
            ...goal,
            tasks: goal.tasks.map(task => 
              task.id === taskId ? { ...task, ...updates } : task
            )
          }
        : goal
    ));
  };

  const handleCurrentDayTaskUpdate = (taskId: string, updates: Partial<any>) => {
    setCurrentDayTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  if (goalsLoading || todayTasksLoading || !isDataLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loading text="Loading your journey..." />
            {goals.length === 0 && isDataLoaded && (
              <div className="mt-8 text-center">
                <p className="font-txc text-lg text-muted-foreground mb-4">
                  No goals found. Set up your initial data to get started!
                </p>
                <Button 
                  onClick={handleSetupData} 
                  disabled={setupLoading}
                  variant="route66"
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  {setupLoading ? "Setting up..." : "Set Up Sample Data"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
              <p className="font-txc text-lg text-route66-brown">
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
              <div className="font-txc-bold text-lg text-route66-red">
                {totalTasks}
              </div>
              <div className="font-txc text-sm text-muted-foreground">
                Stops Planned
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

        {/* Road System */}
        <div className="vintage-card p-8 min-h-[600px]">
          <RoadSystem
            goals={goals}
            currentDayTasks={currentDayTasks}
            onTaskUpdate={handleTaskUpdate}
            onCurrentDayTaskUpdate={handleCurrentDayTaskUpdate}
          />
        </div>

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