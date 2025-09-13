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
  preferences?: string;
}

/**
 * Parse natural language input and extract events using AI
 * This is a placeholder implementation - in a real app, this would call an AI service
 */
export const parseEventsWithAI = async (
  input: string,
  context: UserContext,
  apiKey?: string
): Promise<AIEventResponse> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Log the context including preferences for debugging
  console.log("[AI Events] Processing with context:", {
    ...context,
    preferences: context.preferences ? "User preferences available" : "No preferences set"
  });
  
  // Placeholder implementation - in a real app, this would call Gemini/OpenAI/etc.
  // The AI service would use the preferences to make better scheduling decisions
  // For example, if preferences include "I like to do homework after lectures",
  // the AI would try to schedule homework tasks after lecture events
  
  return {
    events: [],
    errors: [
      "AI event parsing is not yet implemented. This feature requires an AI service integration.",
      context.preferences ? "User preferences will be considered when AI is implemented." : "Consider setting preferences for better AI suggestions."
    ]
  };
};

/**
 * Get current date string in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};
