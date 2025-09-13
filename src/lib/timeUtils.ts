// Utility functions for time-based positioning

export interface TimePosition {
  position: number; // 0-100 percentage
  timeString: string;
}

/**
 * Convert time string (HH:MM) to position percentage (0-100)
 * Maps 12 AM (midnight) to 0% and 11:59 PM to 100% (full 24 hours)
 */
export const timeToPosition = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  // Full 24-hour day from 12 AM (0 minutes) to 11:59 PM (1439 minutes)
  const totalDayMinutes = 24 * 60; // 1440 minutes
  
  // Calculate position as percentage of full day
  const position = (totalMinutes / totalDayMinutes) * 100;
  
  return Math.min(100, Math.max(0, position));
};

/**
 * Convert position percentage (0-100) to time string (HH:MM)
 */
export const positionToTime = (position: number): string => {
  const totalDayMinutes = 24 * 60; // 1440 minutes for full day
  
  const minutes = Math.round((position / 100) * totalDayMinutes);
  
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Get current time position based on real time
 */
export const getCurrentTimePosition = (): number => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  return timeToPosition(timeString);
};

/**
 * Get current time as string
 */
export const getCurrentTimeString = (): string => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Calculate scroll offset to center a specific time position
 */
export const calculateScrollOffset = (targetPosition: number, containerWidth: number, signWidth: number = 140): number => {
  // Calculate the center position of the container
  const containerCenter = containerWidth / 2;
  
  // Calculate where the target position should be
  const targetX = (targetPosition / 100) * containerWidth;
  
  // Calculate the offset needed to center the target
  const offset = containerCenter - targetX;
  
  return offset;
};

/**
 * Get the next upcoming task based on current time
 */
export const getNextUpcomingTask = (tasks: Array<{ time: string; [key: string]: any }>): any | null => {
  const currentTime = getCurrentTimeString();
  const sortedTasks = [...tasks].sort((a, b) => a.time.localeCompare(b.time));
  
  return sortedTasks.find(task => task.time > currentTime) || null;
};

/**
 * Get the current or most recent task based on current time
 */
export const getCurrentTask = (tasks: Array<{ time: string; [key: string]: any }>): any | null => {
  const currentTime = getCurrentTimeString();
  const sortedTasks = [...tasks].sort((a, b) => a.time.localeCompare(b.time));
  
  // Find the most recent task that has already started
  const pastTasks = sortedTasks.filter(task => task.time <= currentTime);
  return pastTasks.length > 0 ? pastTasks[pastTasks.length - 1] : null;
};

/**
 * Generate time scale markers for the 24-hour timeline
 */
export const generateTimeScaleMarkers = (): Array<{ time: string; position: number; label: string }> => {
  const markers = [];
  
  // Generate markers every 2 hours
  for (let hour = 0; hour < 24; hour += 2) {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    const position = timeToPosition(timeString);
    
    // Format label for display
    let label = '';
    if (hour === 0) label = '12 AM';
    else if (hour < 12) label = `${hour} AM`;
    else if (hour === 12) label = '12 PM';
    else label = `${hour - 12} PM`;
    
    markers.push({ time: timeString, position, label });
  }
  
  return markers;
};

/**
 * Generate hour markers for more detailed time scale
 */
export const generateHourMarkers = (): Array<{ time: string; position: number; isMajor: boolean }> => {
  const markers = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    const position = timeToPosition(timeString);
    const isMajor = hour % 2 === 0; // Major markers every 2 hours
    
    markers.push({ time: timeString, position, isMajor });
  }
  
  return markers;
};
