/**
 * Format time string (HH:MM) to 12-hour format
 * @param {string} timeStr - Time in HH:MM format
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeStr; // Return original if formatting fails
  }
};

/**
 * Format date with optional time
 * @param {string} dateString - Date string
 * @param {string} timeStr - Optional time in HH:MM format
 * @returns {string} Formatted date/time
 */
export const formatDateTime = (dateString, timeStr = null) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  let dateDisplay = '';
  
  // Determine date display
  if (date.toDateString() === today.toDateString()) {
    dateDisplay = 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    dateDisplay = 'Yesterday';
  } else {
    const diffTime = today - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7 && diffDays > 0) {
      dateDisplay = `${diffDays} days ago`;
    } else {
      dateDisplay = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }
  
  // Add time if provided
  if (timeStr) {
    const formattedTime = formatTime(timeStr);
    if (formattedTime) {
      return `${dateDisplay} at ${formattedTime}`;
    }
  }
  
  return dateDisplay;
};

/**
 * Sort meetings by date and time
 * @param {Array} meetings - Array of meeting objects
 * @returns {Array} Sorted meetings
 */
export const sortMeetingsByDateTime = (meetings) => {
  return [...meetings].sort((a, b) => {
    // First compare dates
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }
    
    // If dates are equal, compare times
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    
    // Put meetings with times before those without
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    
    return 0;
  });
};