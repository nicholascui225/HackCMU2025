import ICAL from 'ical.js';

export interface ParsedCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: 'event' | 'task';
  confidence: number;
  reasoning: string;
}

export interface CalendarParseResult {
  events: ParsedCalendarEvent[];
  totalEvents: number;
  errors: string[];
}

/**
 * Parse an .ics file content and extract calendar events
 */
export const parseICSFile = (icsContent: string): CalendarParseResult => {
  const events: ParsedCalendarEvent[] = [];
  const errors: string[] = [];

  try {
    // Parse the ICS content
    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    
    // Get all VEVENT components
    const vevents = comp.getAllSubcomponents('vevent');
    
    vevents.forEach((vevent, index) => {
      try {
        const event = new ICAL.Event(vevent);
        
        // Extract basic event information
        const summary = event.summary || `Event ${index + 1}`;
        const description = event.description || '';
        const location = event.location || '';
        
        // Handle dates and times
        const startDate = event.startDate;
        const endDate = event.endDate;
        
        if (!startDate) {
          errors.push(`Event "${summary}" has no start date`);
          return;
        }
        
        // Convert to our app's date/time format
        const startDateStr = formatDateForApp(startDate);
        const endDateStr = endDate ? formatDateForApp(endDate) : startDateStr;
        const startTimeStr = formatTimeForApp(startDate);
        const endTimeStr = endDate ? formatTimeForApp(endDate) : startTimeStr;
        
        // Determine if it's an event or task based on duration and description
        const duration = endDate ? endDate.toJSDate().getTime() - startDate.toJSDate().getTime() : 0;
        const isEvent = duration > 0 && duration < 24 * 60 * 60 * 1000; // Less than 24 hours
        
        const parsedEvent: ParsedCalendarEvent = {
          id: `ics-${index}-${Date.now()}`,
          title: summary,
          description: description,
          startDate: startDateStr,
          endDate: endDateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          location: location,
          type: isEvent ? 'event' : 'task',
          confidence: 0.9, // High confidence for parsed calendar events
          reasoning: `Parsed from calendar: ${isEvent ? 'Scheduled event' : 'Task with deadline'}`
        };
        
        events.push(parsedEvent);
        
      } catch (eventError) {
        errors.push(`Error parsing event ${index + 1}: ${eventError instanceof Error ? eventError.message : 'Unknown error'}`);
      }
    });
    
  } catch (parseError) {
    errors.push(`Failed to parse ICS file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
  
  return {
    events,
    totalEvents: events.length,
    errors
  };
};

/**
 * Format ICAL date to our app's date format (YYYY-MM-DD)
 */
const formatDateForApp = (icalDate: ICAL.Time): string => {
  const jsDate = icalDate.toJSDate();
  return jsDate.toISOString().split('T')[0];
};

/**
 * Format ICAL time to our app's time format (HH:MM)
 */
const formatTimeForApp = (icalDate: ICAL.Time): string => {
  const jsDate = icalDate.toJSDate();
  const hours = String(jsDate.getHours()).padStart(2, '0');
  const minutes = String(jsDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Read file content as text
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
};

/**
 * Validate if a file is a valid .ics file
 */
export const validateICSFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file extension
  if (!file.name.toLowerCase().endsWith('.ics')) {
    return { isValid: false, error: 'File must have .ics extension' };
  }
  
  // Check file size (limit to 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }
  
  // Check MIME type if available
  if (file.type && !file.type.includes('text/calendar') && !file.type.includes('text/plain')) {
    return { isValid: false, error: 'File must be a calendar file' };
  }
  
  return { isValid: true };
};
