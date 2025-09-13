export interface ParsedEvent {
  id: string;
  title: string;
  goalId: string;
  goalTitle: string;
  date: string;
  startTime: string;
  endTime?: string;
  type: 'event' | 'task';
  confidence: number;
  reasoning: string;
}

export interface AIEventResponse {
  events: ParsedEvent[];
  errors?: string[];
}

export interface UserContext {
  goals: Array<{ id: string; title: string; description?: string }>;
  currentDate: string;
  timezone: string;
  existingTasks?: Array<{ date: string; startTime: string; endTime?: string; title: string }>;
}

/**
 * Parse natural language input and extract events using AI
 */
export const parseEventsWithAI = async (
  input: string,
  context: UserContext,
  apiKey?: string
): Promise<AIEventResponse> => {
  console.log("[AI Events] Starting parseEventsWithAI with:", { 
    input, 
    apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : "undefined",
    apiKeyLength: apiKey?.length || 0,
    apiKeyFormat: apiKey?.startsWith('AIza') ? 'valid' : 'invalid'
  });
  
  if (!apiKey) {
    console.log("[AI Events] No API key provided");
    return {
      events: [],
      errors: ["Gemini API key is required for AI event parsing. Please configure VITE_GEMINI_API_KEY in your environment."]
    };
  }

  // Validate API key format
  if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
    console.error("[AI Events] Invalid API key format:", { 
      startsWithAIza: apiKey.startsWith('AIza'),
      length: apiKey.length 
    });
    return {
      events: [],
      errors: ["Invalid Gemini API key format. API keys should start with 'AIza' and be about 39 characters long."]
    };
  }

  try {
    const prompt = `You are an AI assistant that helps parse natural language input into structured calendar events and tasks.

IMPORTANT: You MUST extract events from the user input. Even if the input seems vague, try to interpret it as an event or task.

User Context:
- Current Date: ${context.currentDate}
- Timezone: ${context.timezone}
- Available Goals: ${context.goals.map(g => `${g.id}: ${g.title}`).join(', ')}
- Existing Tasks Today: ${context.existingTasks ? context.existingTasks.filter(t => t.date === context.currentDate).map(t => `${t.startTime} - ${t.endTime || t.startTime}: ${t.title}`).join(', ') || 'None' : 'Unknown'}

User Input: "${input}"

EXAMPLES of what to extract:
- "Meeting with John tomorrow at 2pm" → Event: "Meeting with John", Date: tomorrow, Time: 14:00
- "Doctor appointment next Monday at 10:30am" → Event: "Doctor appointment", Date: next Monday, Time: 10:30
- "Gym workout today at 6pm" → Event: "Gym workout", Date: today, Time: 18:00
- "Call mom tomorrow" → Task: "Call mom", Date: tomorrow, Time: 09:00 (default)
- "Study more math today" → Task: "Study more math", Date: today, Time: 14:00 (suggested)
- "Study for math quiz before tomorrow" → Task: "Study for math quiz", Date: today, Time: 19:00 (suggested)
- "Need to exercise this week" → Task: "Exercise", Date: tomorrow, Time: 18:00 (suggested)

For each event/task you find, provide:
1. A clear title (extract from the input)
2. The date (in YYYY-MM-DD format, calculate from relative dates)
3. Start time (in HH:MM format, 24-hour)
4. End time (in HH:MM format, 24-hour, optional - add 1 hour if not specified)
5. Whether it's an 'event' or 'task' (meetings/appointments = event, calls/tasks = task)
6. A confidence score (0-1)
7. Brief reasoning for your classification

DATE CALCULATIONS (current date: ${context.currentDate}):
- "today" = ${context.currentDate}
- "tomorrow" = ${new Date(new Date(context.currentDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- "next Monday" = calculate the next Monday from current date
- "next week" = add 7 days to current date

TIME CALCULATIONS:
- "2pm" = "14:00"
- "10:30am" = "10:30"
- "6pm" = "18:00"

SMART TIME SUGGESTIONS (when no time is specified):
- Study/learning tasks: 14:00 (2pm) or 19:00 (7pm) - good focus times
- Exercise/fitness: 18:00 (6pm) or 07:00 (7am) - common workout times
- Work/meetings: 09:00 (9am) or 14:00 (2pm) - business hours
- Personal tasks: 10:00 (10am) or 15:00 (3pm) - flexible times
- Evening tasks: 19:00 (7pm) or 20:00 (8pm) - after work
- Morning tasks: 08:00 (8am) or 09:00 (9am) - start of day
- If user says "before tomorrow" or "today", suggest evening time (19:00-20:00)
- If user says "this week", suggest tomorrow at a reasonable time

CONFLICT AVOIDANCE:
- Check existing tasks for the target date
- Avoid scheduling at the same time as existing tasks
- If a preferred time is taken, suggest the next available slot
- For study tasks, prefer quiet times (morning or evening)
- For exercise, prefer early morning or evening

GOAL ASSIGNMENT:
- If user mentions a specific goal, use that goal ID
- Otherwise, create a new goal with title based on the event context
- For "Meeting with John", create goal "Professional Meetings"
- For "Doctor appointment", create goal "Health & Medical"
- For "Gym workout", create goal "Fitness & Health"

Return your response as a JSON object with this exact structure:
{
  "events": [
    {
      "id": "unique-id",
      "title": "Event Title",
      "goalId": "goal-id-or-new-goal-title",
      "goalTitle": "Goal Title",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "type": "event" or "task",
      "confidence": 0.95,
      "reasoning": "Brief explanation"
    }
  ],
  "errors": []
}

CRITICAL: You MUST return at least one event. If the input contains any mention of time, date, or activity, interpret it as an event. Only return empty events array if the input is completely unrelated to scheduling (like "hello" or "how are you").`;

    console.log("[AI Events] Making API call to Gemini...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    console.log("[AI Events] API response status:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[AI Events] API error response:", { status: response.status, errorData });
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("[AI Events] Raw API response:", data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("[AI Events] Invalid response structure:", data);
      throw new Error('Invalid response from Gemini API');
    }

    const responseText = data.candidates[0].content.parts[0].text;
    console.log("[AI Events] AI response text:", responseText);
    
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[AI Events] Could not find JSON in response:", responseText);
      throw new Error('Could not parse JSON from AI response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    console.log("[AI Events] Parsed response:", parsedResponse);
    
    // Validate the response structure
    if (!parsedResponse.events || !Array.isArray(parsedResponse.events)) {
      console.error("[AI Events] Invalid response structure:", parsedResponse);
      throw new Error('Invalid response structure from AI');
    }

    // If AI returned empty events, try to provide a helpful error
    if (parsedResponse.events.length === 0) {
      console.warn("[AI Events] AI returned no events for input:", input);
      return {
        events: [],
        errors: [
          "I couldn't identify any specific events in your input. Try being more specific about dates and times. Examples: 'Meeting with John tomorrow at 2pm' or 'Doctor appointment next Monday at 10:30am'"
        ]
      };
    }

    // Generate unique IDs for events that don't have them
    const eventsWithIds = parsedResponse.events.map((event: any, index: number) => ({
      ...event,
      id: event.id || `ai-event-${Date.now()}-${index}`,
      confidence: event.confidence || 0.8,
      reasoning: event.reasoning || 'AI-generated event'
    }));

    const result = {
      events: eventsWithIds,
      errors: parsedResponse.errors || []
    };
    console.log("[AI Events] Final result:", result);
    return result;

  } catch (error: any) {
    console.error('AI parsing error:', error);
    
    // Try a simple fallback parsing for common patterns
    const fallbackEvent = tryFallbackParsing(input, context);
    if (fallbackEvent) {
      console.log("[AI Events] Using fallback parsing:", fallbackEvent);
      return {
        events: [fallbackEvent],
        errors: ["AI parsing failed, but I found a potential event using fallback parsing. Please review carefully."]
      };
    }
    
    return {
      events: [],
      errors: [`AI parsing failed: ${error.message}`]
    };
  }
};

/**
 * Simple fallback parsing for common event patterns
 */
const tryFallbackParsing = (input: string, context: UserContext): ParsedEvent | null => {
  const lowerInput = input.toLowerCase();
  
  // Check for common time patterns
  const timePatterns = [
    { pattern: /(\d{1,2}):?(\d{2})?\s*(am|pm)/i, format: '12h' },
    { pattern: /(\d{1,2})\s*(am|pm)/i, format: '12h' },
    { pattern: /(\d{1,2}):(\d{2})/i, format: '24h' }
  ];
  
  // Check for date patterns
  const datePatterns = [
    { pattern: /tomorrow/i, offset: 1 },
    { pattern: /today/i, offset: 0 },
    { pattern: /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, offset: 'next-weekday' }
  ];
  
  let foundTime = null;
  let foundDate = null;
  
  // Find time
  for (const timePattern of timePatterns) {
    const match = input.match(timePattern.pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const ampm = match[3]?.toLowerCase();
      
      if (timePattern.format === '12h' && ampm) {
        if (ampm === 'pm' && hours !== 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
      }
      
      foundTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      break;
    }
  }
  
  // Find date
  for (const datePattern of datePatterns) {
    if (datePattern.pattern.test(input)) {
      const today = new Date(context.currentDate);
      if (typeof datePattern.offset === 'number') {
        const targetDate = new Date(today.getTime() + datePattern.offset * 24 * 60 * 60 * 1000);
        foundDate = targetDate.toISOString().split('T')[0];
      }
      break;
    }
  }
  
  // If we found time, date, or it's a task-like input, create a basic event
  if (foundTime || foundDate || isTaskLikeInput(input)) {
    const title = input.replace(/\b(tomorrow|today|next\s+\w+|at\s+\d+|am|pm|more|for|before|this\s+week)\b/gi, '').trim();
    const cleanTitle = title || 'Task';
    
    // Suggest smart time based on task type
    const suggestedTime = foundTime || suggestSmartTime(input, context);
    
    return {
      id: `fallback-${Date.now()}`,
      title: cleanTitle,
      goalId: 'general',
      goalTitle: 'General',
      date: foundDate || context.currentDate,
      startTime: suggestedTime,
      endTime: addOneHour(suggestedTime),
      type: isTaskLikeInput(input) ? 'task' : 'event',
      confidence: 0.6,
      reasoning: 'Fallback parsing with smart time suggestion - please review carefully'
    };
  }
  
  return null;
};

/**
 * Check if input looks like a task (study, exercise, work, etc.)
 */
const isTaskLikeInput = (input: string): boolean => {
  const taskKeywords = [
    'study', 'learn', 'practice', 'exercise', 'workout', 'gym', 'run', 'walk',
    'read', 'write', 'call', 'email', 'clean', 'organize', 'plan', 'prepare',
    'review', 'quiz', 'test', 'exam', 'homework', 'project', 'assignment'
  ];
  
  const lowerInput = input.toLowerCase();
  return taskKeywords.some(keyword => lowerInput.includes(keyword));
};

/**
 * Suggest smart time based on task type and context
 */
const suggestSmartTime = (input: string, context: UserContext): string => {
  const lowerInput = input.toLowerCase();
  
  // Check for urgency indicators
  if (lowerInput.includes('before tomorrow') || lowerInput.includes('today')) {
    return '19:00'; // Evening time for urgent tasks
  }
  
  // Study/learning tasks
  if (lowerInput.includes('study') || lowerInput.includes('learn') || lowerInput.includes('quiz') || lowerInput.includes('exam')) {
    return '14:00'; // Afternoon study time
  }
  
  // Exercise/fitness
  if (lowerInput.includes('exercise') || lowerInput.includes('workout') || lowerInput.includes('gym') || lowerInput.includes('run')) {
    return '18:00'; // Evening workout time
  }
  
  // Work/meetings
  if (lowerInput.includes('meeting') || lowerInput.includes('work') || lowerInput.includes('call')) {
    return '09:00'; // Morning work time
  }
  
  // Personal tasks
  if (lowerInput.includes('clean') || lowerInput.includes('organize') || lowerInput.includes('plan')) {
    return '10:00'; // Mid-morning personal time
  }
  
  // Default to afternoon
  return '15:00';
};

/**
 * Add one hour to a time string
 */
const addOneHour = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const newHours = (hours + 1) % 24;
  return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Get current date string in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};
