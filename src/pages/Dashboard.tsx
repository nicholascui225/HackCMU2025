import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { RoadVisualization } from "@/components/retro/road-visualization";
import { Link } from "react-router-dom";
import { PlusCircle, Target, Calendar, BarChart3, Settings, Save, Trash2 } from "lucide-react";
import { listTodayTasks, toggleTask, type Task as DbTask } from "@/services/goals";
import { useToast } from "@/hooks/use-toast";
import { usePreferences } from "@/hooks/usePreferences";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

const Dashboard = () => {
  const { toast } = useToast();
  const { preferences, isLoading: preferencesLoading, isSaving, savePreferences, deletePreferences } = usePreferences();
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; time: string; completed: boolean; type: DbTask['type']; }>>([]);
  const [preferencesText, setPreferencesText] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
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

  // Update preferences text when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setPreferencesText(preferences.preferences_text);
    }
  }, [preferences]);

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

  const handleSavePreferences = async () => {
    if (!preferencesText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some preferences before saving',
        variant: 'destructive'
      });
      return;
    }

    try {
      await savePreferences(preferencesText.trim());
      setShowPreferences(false);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleDeletePreferences = async () => {
    try {
      await deletePreferences();
      setPreferencesText('');
      setShowPreferences(false);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const testSupabaseConnection = async () => {
    try {
      console.log('=== TESTING SUPABASE CONNECTION ===');
      
      // Test 1: Check current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', sessionData);
      console.log('Session error:', sessionError);
      
      // Test 2: Try to access user_preferences table
      const { data: prefsData, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .limit(1);
      console.log('Preferences table access:', prefsData);
      console.log('Preferences error:', prefsError);
      
      // Test 3: Check if we can reach Supabase
      const { data: healthData, error: healthError } = await supabase
        .from('goals')
        .select('count')
        .limit(1);
      console.log('Health check (goals table):', healthData);
      console.log('Health error:', healthError);
      
      toast({
        title: 'Supabase Test Complete',
        description: 'Check console for detailed results',
        variant: 'default'
      });
    } catch (error) {
      console.error('Supabase test failed:', error);
      toast({
        title: 'Supabase Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
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
              <p className="font-txc text-lg text-route66-brown text-vintage">
                {currentDate}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowPreferences(!showPreferences)}
              >
                <Settings className="h-4 w-4" />
                AI Preferences
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={testSupabaseConnection}
              >
                Test Supabase
              </Button>
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

        {/* AI Preferences Section */}
        {showPreferences && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-route66-red" />
                AI Event Creation Preferences
              </CardTitle>
              <CardDescription>
                Tell the AI about your scheduling preferences to get better event suggestions. 
                For example: "I like to do homework right after lectures" or "I prefer to exercise in the morning".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your scheduling preferences here... (e.g., 'I like to do homework immediately after my lectures', 'I prefer to exercise in the morning before classes', 'I need at least 1 hour between meetings')"
                  value={preferencesText}
                  onChange={(e) => setPreferencesText(e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={isSaving || preferencesLoading}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSavePreferences}
                    disabled={isSaving || preferencesLoading || !preferencesText.trim()}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                  {preferences && (
                    <Button 
                      variant="destructive" 
                      onClick={handleDeletePreferences}
                      disabled={isSaving || preferencesLoading}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Road Visualization */}
        <RoadVisualization 
          tasks={tasks} 
          currentTime={new Date().toTimeString().slice(0,5)} 
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