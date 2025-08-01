/**
 * Time conversion utilities for handling UTC to Asia/Bangkok (UTC+7) conversions
 */

/**
 * Convert UTC time to Asia/Bangkok time (UTC+7)
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {number} hours - Hours in 24-hour format (0-23)
 * @param {number} minutes - Minutes (0-59)
 * @param {number} seconds - Seconds (0-59)
 * @returns {Object} - { date: Date, time: string } with adjusted date and time
 */
function convertUTCtoAsiaTime(dateStr, hours, minutes, seconds) {
  // Create a UTC date/time
  const utcDate = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}Z`);
  
  // Add 7 hours for UTC+7
  const asiaDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
  
  // Extract the adjusted date and time
  const adjustedDate = asiaDate.toISOString().split('T')[0];
  const adjustedHours = asiaDate.getUTCHours();
  const adjustedMinutes = asiaDate.getUTCMinutes();
  const adjustedSeconds = asiaDate.getUTCSeconds();
  
  return {
    date: new Date(adjustedDate),
    time: `${String(adjustedHours).padStart(2, '0')}:${String(adjustedMinutes).padStart(2, '0')}:${String(adjustedSeconds).padStart(2, '0')}`
  };
}

/**
 * Convert a time string from UTC to UTC+7
 * @param {string} timeStr - Time in HH:MM:SS format
 * @param {Date} date - The date to adjust if time crosses midnight
 * @returns {Object} - { date: Date, time: string } with adjusted values
 */
function adjustTimeToUTC7(timeStr, date) {
  if (!timeStr || !date) return { date, time: timeStr };
  
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  const dateStr = date.toISOString().split('T')[0];
  
  return convertUTCtoAsiaTime(dateStr, hours, minutes, seconds || 0);
}

/**
 * Add hours to a time string and handle date overflow
 * @param {string} timeStr - Time in HH:MM:SS format
 * @param {number} hoursToAdd - Number of hours to add
 * @returns {Object} - { time: string, dateOffset: number } where dateOffset is days to add
 */
function addHoursToTime(timeStr, hoursToAdd) {
  const [hours, minutes, seconds = 0] = timeStr.split(':').map(Number);
  
  let newHours = hours + hoursToAdd;
  let dateOffset = 0;
  
  // Handle date overflow
  while (newHours >= 24) {
    newHours -= 24;
    dateOffset++;
  }
  
  while (newHours < 0) {
    newHours += 24;
    dateOffset--;
  }
  
  return {
    time: `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    dateOffset
  };
}

module.exports = {
  convertUTCtoAsiaTime,
  adjustTimeToUTC7,
  addHoursToTime
};