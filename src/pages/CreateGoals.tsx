import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Target, Plus, Sparkles, Send, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addTask, createGoal, listGoals, type Goal } from "@/services/goals";
import { parseEventsWithAI, getCurrentDateString, type ParsedEvent, type AIEventResponse } from "../services/ai-events";
import { isAIConfigured, getAIConfigError } from "@/config/ai";
import { parseICSFile, readFileAsText, validateICSFile, parseRRuleFrequency, type ParsedCalendarEvent } from "@/services/ics-parser";

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

  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ParsedEvent[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  // Calendar upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<ParsedCalendarEvent[]>([]);
  const [showCalendarPreview, setShowCalendarPreview] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [eventGoalSelections, setEventGoalSelections] = useState<Record<string, string>>({});
  const [eventEdits, setEventEdits] = useState<Record<string, {
    date: string;
    startTime: string;
    endTime: string;
    type: 'event' | 'task';
    isRepeating: boolean;
    repeatFrequency: 'daily' | 'weekly' | 'monthly';
    repeatEndDate: string;
  }>>({});
  
  // New goal creation state for calendar uploads
  const [showNewGoalForm, setShowNewGoalForm] = useState<Record<string, boolean>>({});
  const [newGoalTitle, setNewGoalTitle] = useState<Record<string, string>>({});
  const [newGoalDescription, setNewGoalDescription] = useState<Record<string, string>>({});

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

  const handleNaturalLanguageSubmit = async () => {
    if (!naturalLanguageInput.trim()) {
      toast({ title: "Empty Input", description: "Please enter some text to create events", variant: "destructive" });
      return;
    }

    // Check if AI is configured
    if (!isAIConfigured()) {
      const configError = getAIConfigError();
      toast({ 
        title: "AI Not Configured", 
        description: configError || "AI service is not available. Please configure your API key.",
        variant: "destructive" 
      });
      return;
    }

    // Check if user has goals
    if (goals.length === 0) {
      toast({ 
        title: "No Goals Available", 
        description: "Please create at least one goal before using AI event creation.",
        variant: "destructive" 
      });
      return;
    }

    setIsProcessingAI(true);
    setShowAiSuggestions(false);
    
    try {
      console.log("[CreateGoals] Processing natural language input:", naturalLanguageInput);
      
      const userContext = {
        goals,
        currentDate: getCurrentDateString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      const aiResponse: AIEventResponse = await parseEventsWithAI(
        naturalLanguageInput,
        userContext,
        import.meta.env.VITE_GEMINI_API_KEY
      );

      console.log("[CreateGoals] AI response:", aiResponse);

      if (aiResponse.events.length === 0) {
        toast({ 
          title: "No Events Found", 
          description: "I couldn't identify any events in your input. Try being more specific about dates and times.",
          variant: "default"
        });
        return;
      }

      // Show AI suggestions
      setAiSuggestions(aiResponse.events);
      setShowAiSuggestions(true);
      
      toast({ 
        title: "AI Analysis Complete", 
        description: `Found ${aiResponse.events.length} event(s). Review and confirm below.`,
        variant: "default"
      });

      // Show any errors from AI
      if (aiResponse.errors && aiResponse.errors.length > 0) {
        console.warn("[CreateGoals] AI warnings:", aiResponse.errors);
      }
      
    } catch (err: any) {
      console.error("[CreateGoals] AI processing error:", err);
      toast({ 
        title: "AI Processing Error", 
        description: err?.message || "Failed to process natural language input. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateICSFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid File",
        description: validation.error || "Please select a valid .ics calendar file",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessingUpload(true);
    setUploadErrors([]);
    setCalendarEvents([]);
    setShowCalendarPreview(false);

    try {
      console.log("[CreateGoals] Processing uploaded file:", file.name);
      
      // Read file content
      const fileContent = await readFileAsText(file);
      
      // Parse ICS content
      const parseResult = parseICSFile(fileContent);
      
      console.log("[CreateGoals] Parsed events:", parseResult.events.length);
      
      if (parseResult.events.length === 0) {
        toast({
          title: "No Events Found",
          description: "No calendar events were found in this file.",
          variant: "default"
        });
        return;
      }

      // Show parsed events
      setCalendarEvents(parseResult.events);
      setShowCalendarPreview(true);
      setUploadErrors(parseResult.errors);

      // Initialize event edits with detected recurring information
      const initialEdits: Record<string, any> = {};
      parseResult.events.forEach(event => {
        if (event.isRecurring && event.recurrenceRule) {
          const frequency = parseRRuleFrequency(event.recurrenceRule);
          initialEdits[event.id] = {
            date: event.startDate,
            startTime: event.startTime,
            endTime: event.endTime,
            type: event.type,
            isRepeating: true,
            repeatFrequency: frequency,
            repeatEndDate: event.recurrenceEndDate || event.startDate
          };
        }
      });
      setEventEdits(initialEdits);
      
      toast({
        title: "Calendar Imported",
        description: `Found ${parseResult.events.length} event(s). Review and confirm below.`,
        variant: "default"
      });

      // Show any parsing errors
      if (parseResult.errors.length > 0) {
        console.warn("[CreateGoals] Parsing warnings:", parseResult.errors);
        toast({
          title: "Import Warnings",
          description: `${parseResult.errors.length} event(s) had parsing issues. Check the preview below.`,
          variant: "default"
        });
      }

    } catch (err: any) {
      console.error("[CreateGoals] File processing error:", err);
      toast({
        title: "File Processing Error",
        description: err?.message || "Failed to process calendar file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const generateRecurringDates = (startDate: string, frequency: 'daily' | 'weekly' | 'monthly', endDate: string): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      
      switch (frequency) {
        case 'daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return dates;
  };

  const handleCreateNewGoalForEvent = async (eventId: string) => {
    const title = newGoalTitle[eventId];
    const description = newGoalDescription[eventId];
    
    if (!title.trim()) {
      toast({
        title: "Missing Goal Title",
        description: "Please enter a goal title",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("[CreateGoals] Creating new goal for calendar event:", title);
      const newGoal = await createGoal({ 
        title: title.trim(), 
        description: description.trim() || undefined 
      });
      
      // Update goals list
      const updatedGoals = await listGoals();
      setGoals(updatedGoals);
      
      // Set this new goal as selected for the event
      setEventGoalSelections(prev => ({
        ...prev,
        [eventId]: newGoal.id
      }));
      
      // Hide the new goal form
      setShowNewGoalForm(prev => ({
        ...prev,
        [eventId]: false
      }));
      
      // Clear the form
      setNewGoalTitle(prev => ({
        ...prev,
        [eventId]: ""
      }));
      setNewGoalDescription(prev => ({
        ...prev,
        [eventId]: ""
      }));
      
      toast({
        title: "Goal Created",
        description: `"${title}" has been created and selected for this event`,
        variant: "default"
      });
      
    } catch (err: any) {
      console.error("[CreateGoals] Create goal error:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to create goal",
        variant: "destructive"
      });
    }
  };

  const handleAcceptCalendarEvent = async (event: ParsedCalendarEvent, selectedGoalId: string) => {
    try {
      if (!selectedGoalId) {
        toast({
          title: "No Goal Selected",
          description: "Please select a goal for this event.",
          variant: "destructive"
        });
        return;
      }

      // Get edited values or use original values
      const edits = eventEdits[event.id];
      const finalDate = edits?.date || event.startDate;
      const finalStartTime = edits?.startTime || event.startTime;
      const finalEndTime = edits?.endTime === "none" ? undefined : (edits?.endTime || event.endTime);
      const finalType = edits?.type || event.type;
      const isRepeating = edits?.isRepeating || false;
      const repeatFrequency = edits?.repeatFrequency || 'weekly';
      const repeatEndDate = edits?.repeatEndDate || finalDate;

      console.log("[CreateGoals] Adding calendar event:", event.title, isRepeating ? `(repeating ${repeatFrequency})` : '');
      
      if (isRepeating) {
        // Generate recurring events
        const recurringDates = generateRecurringDates(finalDate, repeatFrequency, repeatEndDate);
        
        // Create all recurring instances
        const tasks = recurringDates.map(date => ({
          goal_id: selectedGoalId,
          title: event.title,
          type: finalType,
          date: date,
          start_time: finalStartTime,
          end_time: finalEndTime || undefined,
        }));

        // Add all tasks
        for (const task of tasks) {
          await addTask(task);
        }

        toast({
          title: "Recurring Events Added",
          description: `"${event.title}" has been added ${recurringDates.length} times (${repeatFrequency} until ${repeatEndDate})`,
          variant: "default"
        });
      } else {
        // Single event
        await addTask({
          goal_id: selectedGoalId,
          title: event.title,
          type: finalType,
          date: finalDate,
          start_time: finalStartTime,
          end_time: finalEndTime || undefined,
        });

        toast({
          title: "Event Added",
          description: `"${event.title}" has been added to your journey`,
          variant: "default"
        });
      }

      // Remove from preview and clean up state
      setCalendarEvents(prev => prev.filter(e => e.id !== event.id));
      setEventGoalSelections(prev => {
        const newSelections = { ...prev };
        delete newSelections[event.id];
        return newSelections;
      });
      setEventEdits(prev => {
        const newEdits = { ...prev };
        delete newEdits[event.id];
        return newEdits;
      });

    } catch (err: any) {
      console.error("[CreateGoals] Add calendar event error:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to add event",
        variant: "destructive"
      });
    }
  };

  const handleRejectCalendarEvent = (event: ParsedCalendarEvent) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== event.id));
    toast({
      title: "Event Rejected",
      description: `"${event.title}" was not added`,
      variant: "default"
    });
  };

  const handleAcceptAISuggestion = async (suggestion: ParsedEvent) => {
    try {
      await addTask({
        goal_id: suggestion.goalId,
        title: suggestion.title,
        type: suggestion.type,
        date: suggestion.date,
        start_time: suggestion.startTime,
        end_time: suggestion.endTime || undefined,
      });

      toast({ 
        title: "Event Added", 
        description: `"${suggestion.title}" has been added to your journey`,
        variant: "default"
      });

      // Remove the accepted suggestion
      setAiSuggestions(prev => prev.filter(s => s !== suggestion));
      
      // Hide suggestions if none left
      if (aiSuggestions.length === 1) {
        setShowAiSuggestions(false);
        setNaturalLanguageInput("");
      }
    } catch (err: any) {
      console.error("[CreateGoals] Error adding AI suggestion:", err);
      toast({ 
        title: "Error", 
        description: err?.message || "Failed to add event",
        variant: "destructive" 
      });
    }
  };

  const handleRejectAISuggestion = (suggestion: ParsedEvent) => {
    setAiSuggestions(prev => prev.filter(s => s !== suggestion));
    
    if (aiSuggestions.length === 1) {
      setShowAiSuggestions(false);
      setNaturalLanguageInput("");
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

                  <Button onClick={handleAddGoal} variant="desert" className="w-full mt-auto bg-gradient-to-b from-route66-red to-route66-orange hover:from-route66-red/90 hover:to-route66-orange/90 text-white border-0">
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

                  <Button onClick={addStop} variant="route66" className="w-full bg-gradient-to-b from-route66-red to-route66-orange hover:from-route66-red/90 hover:to-route66-orange/90 text-white border-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stop
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Import Options Section */}
          <div className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Natural Language Input Section */}
              <Card className="retro-card">
                <CardHeader>
                  <CardTitle className="font-txc-bold text-route66-red flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI-Powered Event Creation
                  </CardTitle>
                  <p className="font-txc text-muted-foreground text-sm">
                    Describe your events in natural language and let AI help create your journey
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="natural-language" className="font-txc text-route66-orange">
                      Describe Your Events
                    </Label>
                    <Textarea
                      id="natural-language"
                      value={naturalLanguageInput}
                      onChange={(e) => setNaturalLanguageInput(e.target.value)}
                      placeholder="Example: 'I have a meeting with the team tomorrow at 2 PM, then I need to finish the project report by Friday, and I want to schedule a workout session every Tuesday and Thursday at 6 AM'"
                      className="highway-input font-txc mt-1 min-h-[120px]"
                      rows={5}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground font-txc">
                      💡 Tip: Be specific about dates, times, and event types for better results
                    </div>
                    <Button 
                      onClick={handleNaturalLanguageSubmit} 
                      variant="route66" 
                      disabled={isProcessingAI || !naturalLanguageInput.trim()}
                      className="flex items-center gap-2 px-6 bg-gradient-to-b from-route66-red to-route66-orange hover:from-route66-red/90 hover:to-route66-orange/90 text-white border-0 disabled:opacity-50"
                    >
                      {isProcessingAI ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          Create
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Import from Uploads Section */}
              <Card className="retro-card">
                <CardHeader>
                  <CardTitle className="font-txc-bold text-route66-red flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import from Calendar Files
                  </CardTitle>
                  <p className="font-txc text-muted-foreground text-sm">
                    Upload .ics calendar files to automatically import events into your journey
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="calendar-upload" className="font-txc text-route66-orange">
                      Upload Calendar File (.ics)
                    </Label>
                    <div className="mt-2">
                      <input
                        id="calendar-upload"
                        type="file"
                        accept=".ics"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button
                        variant="outline"
                        className="w-full h-[120px] border-2 border-dashed border-route66-orange/50 hover:border-route66-orange hover:bg-route66-orange/5 flex flex-col items-center justify-center gap-2 font-txc"
                        onClick={() => document.getElementById('calendar-upload')?.click()}
                        disabled={isProcessingUpload}
                      >
                        {isProcessingUpload ? (
                          <>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-route66-orange"></div>
                            <span className="text-route66-orange font-medium">Processing...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-route66-orange" />
                            <span className="text-route66-orange font-medium">Choose .ics file</span>
                            <span className="text-xs text-muted-foreground">or drag and drop here</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground font-txc">
                      📅 Supports standard .ics calendar files
                    </div>
                    <Button 
                      variant="desert" 
                      disabled={calendarEvents.length === 0}
                      className="flex items-center gap-2 bg-gradient-to-b from-route66-red to-route66-orange hover:from-route66-red/90 hover:to-route66-orange/90 text-white border-0 disabled:opacity-50"
                      onClick={() => {
                        if (calendarEvents.length > 0) {
                          setShowCalendarPreview(true);
                        }
                      }}
                    >
                      <Upload className="h-4 w-4" />
                      {calendarEvents.length > 0 ? `Import ${calendarEvents.length} Events` : 'Import Events'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* AI Suggestions */}
          {showAiSuggestions && aiSuggestions.length > 0 && (
            <div className="mt-6">
              <Card className="retro-card">
                <CardHeader>
                  <CardTitle className="font-txc-bold text-route66-orange flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Suggestions ({aiSuggestions.length})
                  </CardTitle>
                  <p className="font-txc text-muted-foreground text-sm">
                    Review and confirm the events I found in your input
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="vintage-card p-4 border border-route66-orange/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-txc-bold text-route66-red">{suggestion.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-txc ${
                              suggestion.type === 'event' 
                                ? 'bg-route66-orange/20 text-route66-orange' 
                                : 'bg-route66-red/20 text-route66-red'
                            }`}>
                              {suggestion.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm font-txc text-muted-foreground">
                            <div>
                              <span className="text-route66-orange">Goal:</span> {suggestion.goalTitle}
                            </div>
                            <div>
                              <span className="text-route66-orange">Date:</span> {suggestion.date}
                            </div>
                            <div>
                              <span className="text-route66-orange">Time:</span> {suggestion.startTime}
                              {suggestion.endTime && ` - ${suggestion.endTime}`}
                            </div>
                            <div>
                              <span className="text-route66-orange">Reasoning:</span> {suggestion.reasoning}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleAcceptAISuggestion(suggestion)}
                            variant="route66"
                            size="sm"
                            className="font-txc bg-gradient-to-b from-route66-red to-route66-orange hover:from-route66-red/90 hover:to-route66-orange/90 text-white border-0"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleRejectAISuggestion(suggestion)}
                            variant="outline"
                            size="sm"
                            className="font-txc border-route66-orange text-route66-orange hover:bg-route66-orange/10"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <Button
                      onClick={() => {
                        setShowAiSuggestions(false);
                        setAiSuggestions([]);
                        setNaturalLanguageInput("");
                      }}
                      variant="outline"
                      className="font-txc"
                    >
                      Cancel
                    </Button>
                    <div className="text-xs text-muted-foreground font-txc">
                      Accept events you want to add to your journey
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Calendar Import Preview */}
          {showCalendarPreview && calendarEvents.length > 0 && (
            <div className="mt-6">
              <Card className="retro-card">
                <CardHeader>
                  <CardTitle className="font-txc-bold text-route66-orange flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Calendar Import Preview ({calendarEvents.length})
                  </CardTitle>
                  <p className="font-txc text-muted-foreground text-sm">
                    Review and confirm the events from your calendar file
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {calendarEvents.map((event, index) => (
                    <div key={event.id} className="vintage-card p-4 border border-route66-orange/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-txc-bold text-route66-red">{event.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-txc ${
                              event.type === 'event' 
                                ? 'bg-route66-orange/20 text-route66-orange' 
                                : 'bg-route66-red/20 text-route66-red'
                            }`}>
                              {event.type}
                            </span>
                            {event.isRecurring && (
                              <span className="px-2 py-1 rounded text-xs font-txc bg-green-100 text-green-800">
                                🔄 Recurring
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {Math.round(event.confidence * 100)}% confidence
                            </span>
                          </div>
                          
                          {/* Editable Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            {/* Date */}
                            <div>
                              <Label htmlFor={`date-${event.id}`} className="font-txc text-route66-orange text-sm">
                                Date
                              </Label>
                              <Input
                                id={`date-${event.id}`}
                                type="date"
                                value={eventEdits[event.id]?.date || event.startDate}
                                onChange={(e) => {
                                  setEventEdits(prev => ({
                                    ...prev,
                                    [event.id]: {
                                      ...prev[event.id],
                                      date: e.target.value,
                                      startTime: prev[event.id]?.startTime || event.startTime,
                                      endTime: prev[event.id]?.endTime || event.endTime,
                                      type: prev[event.id]?.type || event.type
                                    }
                                  }));
                                }}
                                className="retro-input font-txc mt-1"
                              />
                            </div>

                            {/* Type */}
                            <div>
                              <Label htmlFor={`type-${event.id}`} className="font-txc text-route66-orange text-sm">
                                Type
                              </Label>
                              <Select 
                                value={eventEdits[event.id]?.type || event.type}
                                onValueChange={(value: 'event' | 'task') => {
                                  setEventEdits(prev => ({
                                    ...prev,
                                    [event.id]: {
                                      ...prev[event.id],
                                      date: prev[event.id]?.date || event.startDate,
                                      startTime: prev[event.id]?.startTime || event.startTime,
                                      endTime: prev[event.id]?.endTime || event.endTime,
                                      type: value
                                    }
                                  }));
                                }}
                              >
                                <SelectTrigger id={`type-${event.id}`} className="retro-input font-txc mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="task">Task</SelectItem>
                                  <SelectItem value="event">Event</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Start Time */}
                            <div>
                              <Label htmlFor={`start-time-${event.id}`} className="font-txc text-route66-orange text-sm">
                                Start Time
                              </Label>
                              <Select 
                                value={eventEdits[event.id]?.startTime || event.startTime}
                                onValueChange={(value) => {
                                  setEventEdits(prev => ({
                                    ...prev,
                                    [event.id]: {
                                      ...prev[event.id],
                                      date: prev[event.id]?.date || event.startDate,
                                      startTime: value,
                                      endTime: prev[event.id]?.endTime || event.endTime,
                                      type: prev[event.id]?.type || event.type
                                    }
                                  }));
                                }}
                              >
                                <SelectTrigger id={`start-time-${event.id}`} className="retro-input font-txc mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeOptions.map((time) => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* End Time */}
                            <div>
                              <Label htmlFor={`end-time-${event.id}`} className="font-txc text-route66-orange text-sm">
                                End Time (Optional)
                              </Label>
                              <Select 
                                value={eventEdits[event.id]?.endTime || event.endTime || "none"}
                                onValueChange={(value) => {
                                  setEventEdits(prev => ({
                                    ...prev,
                                    [event.id]: {
                                      ...prev[event.id],
                                      date: prev[event.id]?.date || event.startDate,
                                      startTime: prev[event.id]?.startTime || event.startTime,
                                      endTime: value === "none" ? undefined : value,
                                      type: prev[event.id]?.type || event.type
                                    }
                                  }));
                                }}
                              >
                                <SelectTrigger id={`end-time-${event.id}`} className="retro-input font-txc mt-1">
                                  <SelectValue placeholder="No end time" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No end time</SelectItem>
                                  {timeOptions.map((time) => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Repeat Settings */}
                          <div className="mt-4 p-3 bg-route66-orange/10 rounded-lg border border-route66-orange/20">
                            <div className="flex items-center gap-2 mb-3">
                              <input
                                type="checkbox"
                                id={`repeat-${event.id}`}
                                checked={eventEdits[event.id]?.isRepeating || false}
                                onChange={(e) => {
                                  setEventEdits(prev => ({
                                    ...prev,
                                    [event.id]: {
                                      ...prev[event.id],
                                      date: prev[event.id]?.date || event.startDate,
                                      startTime: prev[event.id]?.startTime || event.startTime,
                                      endTime: prev[event.id]?.endTime || event.endTime,
                                      type: prev[event.id]?.type || event.type,
                                      isRepeating: e.target.checked,
                                      repeatFrequency: prev[event.id]?.repeatFrequency || 'weekly',
                                      repeatEndDate: prev[event.id]?.repeatEndDate || event.startDate
                                    }
                                  }));
                                }}
                                className="rounded"
                              />
                              <Label htmlFor={`repeat-${event.id}`} className="font-txc text-route66-orange text-sm font-medium">
                                Make this a repeating event
                              </Label>
                            </div>

                            {eventEdits[event.id]?.isRepeating && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Repeat Frequency */}
                                <div>
                                  <Label htmlFor={`frequency-${event.id}`} className="font-txc text-route66-orange text-sm">
                                    Repeat every
                                  </Label>
                                  <Select 
                                    value={eventEdits[event.id]?.repeatFrequency || 'weekly'}
                                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => {
                                      setEventEdits(prev => ({
                                        ...prev,
                                        [event.id]: {
                                          ...prev[event.id],
                                          date: prev[event.id]?.date || event.startDate,
                                          startTime: prev[event.id]?.startTime || event.startTime,
                                          endTime: prev[event.id]?.endTime || event.endTime,
                                          type: prev[event.id]?.type || event.type,
                                          isRepeating: true,
                                          repeatFrequency: value,
                                          repeatEndDate: prev[event.id]?.repeatEndDate || event.startDate
                                        }
                                      }));
                                    }}
                                  >
                                    <SelectTrigger id={`frequency-${event.id}`} className="retro-input font-txc mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="daily">Day</SelectItem>
                                      <SelectItem value="weekly">Week</SelectItem>
                                      <SelectItem value="monthly">Month</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Repeat End Date */}
                                <div>
                                  <Label htmlFor={`repeat-end-${event.id}`} className="font-txc text-route66-orange text-sm">
                                    Until
                                  </Label>
                                  <Input
                                    id={`repeat-end-${event.id}`}
                                    type="date"
                                    value={eventEdits[event.id]?.repeatEndDate || event.startDate}
                                    onChange={(e) => {
                                      setEventEdits(prev => ({
                                        ...prev,
                                        [event.id]: {
                                          ...prev[event.id],
                                          date: prev[event.id]?.date || event.startDate,
                                          startTime: prev[event.id]?.startTime || event.startTime,
                                          endTime: prev[event.id]?.endTime || event.endTime,
                                          type: prev[event.id]?.type || event.type,
                                          isRepeating: true,
                                          repeatFrequency: prev[event.id]?.repeatFrequency || 'weekly',
                                          repeatEndDate: e.target.value
                                        }
                                      }));
                                    }}
                                    className="retro-input font-txc mt-1"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Original Info Display */}
                          <div className="mt-3 p-2 bg-route66-sand/20 rounded text-xs font-txc text-muted-foreground">
                            <div className="grid grid-cols-2 gap-2">
                              {event.location && (
                                <div>
                                  <span className="text-route66-orange">Location:</span> {event.location}
                                </div>
                              )}
                              <div>
                                <span className="text-route66-orange">Source:</span> {event.reasoning}
                              </div>
                            </div>
                          </div>
                          
                          {event.description && (
                            <div className="mt-2 text-sm font-txc text-muted-foreground">
                              <span className="text-route66-orange">Description:</span> {event.description}
                            </div>
                          )}

                          {/* Goal Selection */}
                          <div className="mt-3">
                            <Label htmlFor={`goal-select-${event.id}`} className="font-txc text-route66-orange text-sm">
                              Add to Goal:
                            </Label>
                            <Select 
                              value={eventGoalSelections[event.id] || ""} 
                              onValueChange={(value) => {
                                if (value === "create_new") {
                                  setShowNewGoalForm(prev => ({
                                    ...prev,
                                    [event.id]: true
                                  }));
                                } else {
                                  setEventGoalSelections(prev => ({
                                    ...prev,
                                    [event.id]: value
                                  }));
                                }
                              }}
                            >
                              <SelectTrigger id={`goal-select-${event.id}`} className="retro-input font-txc mt-1">
                                <SelectValue placeholder="Select a goal" />
                              </SelectTrigger>
                              <SelectContent>
                                {goals.length === 0 ? (
                                  <SelectItem value="no_goals" disabled>No goals available</SelectItem>
                                ) : (
                                  goals.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                                  ))
                                )}
                                <SelectItem value="create_new" className="text-route66-orange font-medium">
                                  ➕ Create New Goal
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            {/* New Goal Creation Form */}
                            {showNewGoalForm[event.id] && (
                              <div className="mt-3 p-3 bg-route66-sand/20 rounded-lg border border-route66-orange/30">
                                <div className="space-y-3">
                                  <div>
                                    <Label htmlFor={`new-goal-title-${event.id}`} className="font-txc text-route66-orange text-sm">
                                      Goal Title
                                    </Label>
                                    <Input
                                      id={`new-goal-title-${event.id}`}
                                      value={newGoalTitle[event.id] || ""}
                                      onChange={(e) => {
                                        setNewGoalTitle(prev => ({
                                          ...prev,
                                          [event.id]: e.target.value
                                        }));
                                      }}
                                      placeholder="Enter goal title"
                                      className="retro-input font-txc mt-1"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor={`new-goal-desc-${event.id}`} className="font-txc text-route66-orange text-sm">
                                      Description (Optional)
                                    </Label>
                                    <Textarea
                                      id={`new-goal-desc-${event.id}`}
                                      value={newGoalDescription[event.id] || ""}
                                      onChange={(e) => {
                                        setNewGoalDescription(prev => ({
                                          ...prev,
                                          [event.id]: e.target.value
                                        }));
                                      }}
                                      placeholder="Enter goal description"
                                      className="retro-input font-txc mt-1"
                                      rows={2}
                                    />
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleCreateNewGoalForEvent(event.id)}
                                      variant="route66"
                                      size="sm"
                                      className="font-txc bg-gradient-to-b from-route66-red to-route66-orange hover:from-route66-red/90 hover:to-route66-orange/90 text-white border-0"
                                      disabled={!newGoalTitle[event.id]?.trim()}
                                    >
                                      Create Goal
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setShowNewGoalForm(prev => ({
                                          ...prev,
                                          [event.id]: false
                                        }));
                                        setNewGoalTitle(prev => ({
                                          ...prev,
                                          [event.id]: ""
                                        }));
                                        setNewGoalDescription(prev => ({
                                          ...prev,
                                          [event.id]: ""
                                        }));
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="font-txc"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleAcceptCalendarEvent(event, eventGoalSelections[event.id])}
                            variant="route66"
                            size="sm"
                            className="font-txc bg-gradient-to-b from-route66-red to-route66-orange hover:from-route66-red/90 hover:to-route66-orange/90 text-white border-0"
                            disabled={!eventGoalSelections[event.id]}
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleRejectCalendarEvent(event)}
                            variant="outline"
                            size="sm"
                            className="font-txc border-route66-orange text-route66-orange hover:bg-route66-orange/10"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {uploadErrors.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-txc-bold text-yellow-800 mb-2">Import Warnings:</h4>
                      <ul className="text-sm text-yellow-700 font-txc space-y-1">
                        {uploadErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <Button
                      onClick={() => {
                        setShowCalendarPreview(false);
                        setCalendarEvents([]);
                        setUploadedFile(null);
                        setUploadErrors([]);
                        setEventGoalSelections({});
                        setEventEdits({});
                        setShowNewGoalForm({});
                        setNewGoalTitle({});
                        setNewGoalDescription({});
                      }}
                      variant="outline"
                      className="font-txc"
                    >
                      Cancel
                    </Button>
                    <div className="text-xs text-muted-foreground font-txc">
                      Accept events you want to add to your journey
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGoals;