import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Goal } from "@/services/goals";

// Define the structure for a parsed event
export interface ParsedEvent {
  title: string;
  goalId: string;
  goalTitle: string; // Added for display purposes in UI
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string; // HH:MM (optional)
  type: 'event' | 'task';
  confidence: number; // 0-1, how confident the AI is
  reasoning?: string; // Explanation from AI
}

// Define the expected structure of the AI's JSON response
export interface AIEventResponse {
  events: ParsedEvent[];
  errors?: string[]; // Optional array of errors/warnings from AI
}

// Context for the AI
interface UserContext {
  goals: Goal[];
  currentDate: string; // YYYY-MM-DD
  timezone: string;
}

// Utility to get current date in YYYY-MM-DD format
export const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const parseEventsWithAI = async (
  naturalLanguageInput: string,
  userContext: UserContext,
  apiKey: string
): Promise<AIEventResponse> => {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const availableGoals = userContext.goals.map(g => ({
    id: g.id,
    title: g.title,
    description: g.description
  }));

  const prompt = `
    You are an intelligent assistant designed to parse natural language input into structured event and task data.
    The user wants to create events/tasks based on their input.
    
    Here is the current date: ${userContext.currentDate}
    Here is the user's timezone: ${userContext.timezone}
    Here are the user's existing goals (important for assigning events/tasks):
    ${JSON.stringify(availableGoals, null, 2)}

    Please parse the following natural language input and extract all identifiable events or tasks.
    For each event/task, determine:
    - 'title': A concise title for the event/task.
    - 'goalId': The ID of the most relevant goal from the provided list. If no clear goal matches, pick the most general or first goal. If no goals are provided, use a placeholder like "no_goal_assigned".
    - 'goalTitle': The title of the assigned goal.
    - 'date': The date of the event/task in YYYY-MM-DD format. Use the current date if no date is specified, or infer relative dates (e.g., "tomorrow", "next Monday").
    - 'startTime': The start time in HH:MM (24-hour) format. Infer if vague (e.g., "morning" -> "09:00", "evening" -> "18:00"). If no time is specified, use "00:00".
    - 'endTime': The end time in HH:MM (24-hour) format, if specified.
    - 'type': 'event' for scheduled appointments/meetings, 'task' for to-do items.
    - 'confidence': A float between 0 and 1 indicating your confidence in the parsing.
    - 'reasoning': A brief explanation for your choices, especially for goal assignment or date/time inference.

    If multiple events/tasks are mentioned, extract all of them.
    If no events/tasks are found, return an empty array for 'events'.

    Your response MUST be a JSON object matching the following TypeScript interface:
    interface AIEventResponse {
      events: {
        title: string;
        goalId: string;
        goalTitle: string;
        date: string;
        startTime: string;
        endTime?: string;
        type: 'event' | 'task';
        confidence: number;
        reasoning?: string;
      }[];
      errors?: string[]; // Optional array of errors/warnings from AI
    }

    Natural Language Input: "${naturalLanguageInput}"
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1, // Keep low for structured output
      },
    });

    const responseText = result.response.text();
    const aiResponse: AIEventResponse = JSON.parse(responseText);

    // Basic validation of the response structure
    if (!aiResponse || !Array.isArray(aiResponse.events)) {
      throw new Error("Invalid AI response format.");
    }

    // Further validation and default assignments for each event
    aiResponse.events = aiResponse.events.map(event => {
      // Ensure goalId and goalTitle are valid
      const matchedGoal = availableGoals.find(g => g.id === event.goalId || g.title.toLowerCase() === event.goalTitle.toLowerCase());
      if (matchedGoal) {
        event.goalId = matchedGoal.id;
        event.goalTitle = matchedGoal.title;
      } else if (availableGoals.length > 0) {
        // Default to the first available goal if no match
        event.goalId = availableGoals[0].id;
        event.goalTitle = availableGoals[0].title;
        event.reasoning = event.reasoning ? `${event.reasoning}. Defaulted to first goal.` : "Defaulted to first goal.";
      } else {
        // Fallback if no goals exist
        event.goalId = "no_goal_assigned";
        event.goalTitle = "No Goal";
        event.reasoning = event.reasoning ? `${event.reasoning}. No goals available.` : "No goals available.";
      }

      // Ensure date is in YYYY-MM-DD format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
        event.date = getCurrentDateString(); // Default to current date if format is wrong
        event.reasoning = event.reasoning ? `${event.reasoning}. Corrected date format.` : "Corrected date format.";
      }

      // Ensure time is in HH:MM format
      if (!/^\d{2}:\d{2}$/.test(event.startTime)) {
        event.startTime = "00:00"; // Default to midnight
        event.reasoning = event.reasoning ? `${event.reasoning}. Corrected start time format.` : "Corrected start time format.";
      }
      if (event.endTime && !/^\d{2}:\d{2}$/.test(event.endTime)) {
        delete event.endTime; // Remove if format is wrong
        event.reasoning = event.reasoning ? `${event.reasoning}. Removed invalid end time.` : "Removed invalid end time.";
      }

      // Ensure type is valid
      if (event.type !== 'event' && event.type !== 'task') {
        event.type = 'task'; // Default to task
        event.reasoning = event.reasoning ? `${event.reasoning}. Corrected type.` : "Corrected type.";
      }

      // Ensure confidence is a number between 0 and 1
      event.confidence = Math.max(0, Math.min(1, event.confidence || 0.5)); // Default to 0.5

      return event;
    });

    return aiResponse;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : String(error)}`);
  }
};

